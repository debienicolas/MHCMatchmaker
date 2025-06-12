from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import pandas as pd
import io
from ast import literal_eval
import time
import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import json
import uuid
from fastapi.responses import JSONResponse
from queue import Queue
from openpyxl import load_workbook
import threading
import logging
import time
import traceback
from fastapi.logger import logger as fastapi_logger

# log to a file 

def setup_logging():
    for handler in logging.root.handlers:
        logging.root.removeHandler(handler)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[logging.StreamHandler()]
    )

    fastapi_logger.handlers = logging.root.handlers

#logging.basicConfig(filename='app.log', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Import your existing Python logic
from matchmaker import MHCMatchmaker
import database
import utils.data_exporter as data_exporter
from datetime import datetime, timedelta


### API ###

app = FastAPI()

setup_logging()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ "http://localhost:8000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static files directory
### UNCOMMENT THIS FOR DEPLOYMENT ###
app.mount("/static", StaticFiles(directory="frontend/build/static"), name="react_app")

# Mount the docs directory
app.mount("/docs", StaticFiles(directory="docs/build/html", html=True), name="docs")


# Initialise the database
db = database.get_database()

# Unitialise the job store and job queue
job_store = {}
job_queue = Queue()

MAX_JOBS_STORED = 1  # Adjust based on your needs
JOB_RETENTION_HOURS = 1  # How long to keep completed jobs


def cleanup_old_jobs():
    """Remove old completed/error jobs from the job store"""
    current_time = datetime.now()
    jobs_to_remove = []
    
    for job_id, job in job_store.items():
        # Remove jobs that are too old
        if (job["status"] in ["completed", "error"] and 
            "completion_time" in job and 
            current_time - job["completion_time"] > timedelta(hours=JOB_RETENTION_HOURS)):
            jobs_to_remove.append(job_id)
            
        # If we have too many jobs, remove the oldest completed ones
        if len(job_store) > MAX_JOBS_STORED:
            completed_jobs = [(jid, j) for jid, j in job_store.items() 
                            if j["status"] in ["completed", "error"]]
            completed_jobs.sort(key=lambda x: x[1].get("completion_time", current_time))
            jobs_to_remove.extend(job[0] for job in completed_jobs[:len(job_store) - MAX_JOBS_STORED])
    
    for job_id in jobs_to_remove:
        del job_store[job_id]
## Setup the worker thread

def worker():
    """
    Worker thread that consumes jobs from the job queue and executes them by running the process_job function.
    """
    while True:
        try:
            job = job_queue.get()
            job_id = job[-1]  # Assuming job_id is the last item in the job tuple
            job_store[job_id]["status"] = "processing"
            process_job(*job)
            cleanup_old_jobs()
        except Exception as e:
            fastapi_logger.error(f"Error in worker thread: {str(e)}")
            fastapi_logger.error(traceback.format_exc())
        finally:
            job_queue.task_done()
        time.sleep(1)  # Small delay to prevent CPU overuse

# create a thread for the worker
thread = threading.Thread(target=worker, daemon=True)
thread.start()

###### API ENDPOINTS ######

@app.get("/api/allele/{allele_id}")
async def get_allele(allele_id: str):
    """
    Used to get a database entry for a given allele.

    Parameters:
    allele_id (str): The ID of the allele to get.

    Returns:
    dict: The database entry for the given allele.
    """
    if allele_id not in db.get_all_ids():
        raise HTTPException(status_code=404, detail="Allele ID not found in database")
    else:
        return db.find_dict(allele_id)
    

@app.get("/api/eplets/{allele_id}")
async def get_eplets(allele_id: str):
    """
    Used to get the eplets for a given allele.

    Parameters:
    allele_id (str): The ID of the allele to get.

    Returns:
    list: The eplets for the given allele.
    """
    if allele_id not in db.get_all_ids():
        raise HTTPException(status_code=404, detail="Allele ID not found in database")
    else:
        return db.find(allele_id).eplets

@app.get("/api/allele_ids")
async def get_all_allele_ids():
    """
    Used to get all allele IDs in the database.

    Returns:
    list: A list of all allele IDs in the database.
    """
    return db.get_all_ids_filtered()


@app.get("/api/consensus_seq/{allele_class}")
async def get_consensus_sequence(allele_class:str):
    """
    Used to get the consensus sequence for a given allele class.

    Parameters:
    allele_class (str): The class of the allele to get.

    Returns:
    str: The consensus sequence for the given allele class.
    """
    if allele_class not in ["I", "IIDQA", "IIDQB", "IIDRA", "IIDRB"]:
        raise HTTPException(status_code=400, detail="Invalid allele class")
    else:
        print("Getting consensus sequence for class: ",allele_class)
        return db.get_consensus_seq(allele_class)


@app.get("/api/consensus_distribution/{allele_class}")
async def get_consensus_distribution(allele_class:str):
    """
    Used to get the distribution of the consensus sequences for a given allele class.

    Parameters:
    allele_class (str): The class of the allele to get.

    Returns:
    dict: The distribution of the consensus sequences for the given allele class.
    """
    distribution = {}
    
    dist_list = db.get_consensus_distribution(allele_class)
    consensus_seq = db.get_consensus_seq(allele_class)

    assert len(dist_list) == len(consensus_seq), "Distribution list and consensus sequence list have different lengths"

    for i in range(len(dist_list)):
        distribution[i] = [dist_list[i],consensus_seq[i]]

    return distribution

@app.get("/api/output_files/{information}")
async def get_output_files(information: str):
    # turn the information from a JSON Sringify to a dictionary
    info = json.loads(information)
    print(info)
    output_files = {
        "input": data_exporter.export_input(info["donors"], info["recipients"], info["relevant_classes"], write_to_file=False),
        "alignment": data_exporter.export_alignment(info["donors"], info["recipients"], info["relevant_classes"], write_to_file=False)
    }
    return output_files

@app.post("/job_submission")
async def job_submission(file: UploadFile = File(None), 
                     rsa: float = Form(...),
                     created_data: str = Form(None)):
    """
    Handles a job submission by parsing the input data and adding it to the job queue.
    The initial status of the job is "queued".

    Parameters:
    file (UploadFile, optional): The CSV file to upload.
    rsa (float): The RSA threshold to use for filtering.
    created_data (str, optional): The created data to use for the job.

    Returns:
    dict: The status of the job and its ID.
    """
    # generate a random job id
    job_id = str(uuid.uuid4())
    job_store[job_id] = {"status": "queued"}
    
    if file:
        file_contents = await file.read()
        file_extension = file.filename.split(".")[-1].lower()
    else:
        file_contents = None
        file_extension = None
    
    fastapi_logger.info(f"Queueing upload for job {job_id}")

    job_queue.put((file_contents, file_extension, rsa, created_data, job_id))

    fastapi_logger.info(f"Job {job_id} added to queue")

    return {"status": "queued", "id": job_id}

@app.get("/poll_results/{job_id}")
async def poll_results(job_id: str):
    """
    Used to poll the status of a job.

    Parameters:
    job_id (str): The ID of the job to poll.

    Returns:
    dict: The status of the job and its result.

    Exceptions:
    404: The job ID is not found.
    400: Error occured when executing the job.
    """

    if job_id not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = job_store[job_id]
    queue_position = list(job_store.keys()).index(job_id) if job["status"] == "queued" else None
    
    if job["status"] == "error":
        return JSONResponse(
            status_code=400,
            content={"status": job["status"], "result": job.get("result", {"error": "Unknown error occurred"}), "queue_position": queue_position}
        )
    
    return {"status": job["status"], "result": job.get("result"), "queue_position": queue_position}


def process_job(file, file_extension, rsa, created_data, job_id):
    fastapi_logger.info(f"Starting process_upload for job {job_id}")
    
    job_store[job_id]["status"] = "processing"
    start_time = time.time()

    mhc_compare = MHCMatchmaker()

    # For the methods handling the input data, we need to catch any errors and return a detailed error message
    # Methods with detailed outside error handling: set_inputs_csv, set_inputs_excel
    try:
        fastapi_logger.info(f"Job {job_id}: Parsing input data")
        if file is not None:
            if file_extension == "csv":
                fastapi_logger.info(f"Job {job_id}: Processing CSV file")
                try:
                    df = pd.read_csv(io.StringIO(file.decode('utf-8')))
                except Exception as e:
                    error_message = f"Error in process_upload for job {job_id}: {str(e)}"
                    fastapi_logger.error(error_message)
                    fastapi_logger.error(traceback.format_exc())
                    job_store[job_id] = {"status": "error", 
                                         "result": {"error": "Empty or invalid file uploaded"},
                                         "completion_time": datetime.now()}
                    return
                df.haplotype = df.haplotype.apply(literal_eval)
                donors, recipients = mhc_compare.set_inputs_csv(df)
                fastapi_logger.info(f"Job {job_id}: CSV processed, donors and recipients set")

                # check if there are errors in this part of the code and catch them

            elif file_extension in ["xlsx", "xls"]:
                fastapi_logger.info(f"Job {job_id}: Processing Excel file")
                workbook = load_workbook(io.BytesIO(file))
                donors, recipients = mhc_compare.set_inputs_excel(workbook)
                fastapi_logger.info(f"Job {job_id}: Excel processed, donors and recipients set")

            else:
                raise ValueError("Invalid file extension")
        elif created_data:
            fastapi_logger.info(f"Job {job_id}: Processing created data")
            data = json.loads(created_data)
            donors = [{"identifier": d["identifier"], "type":d["type"],"haplotype": d["alleles"]} for d in data["donors"]]
            recipients = [{"identifier": r["identifier"], "type":r["type"],"haplotype": r["alleles"]} for r in data["recipients"]]
            df = pd.DataFrame(donors + recipients)
            donors, recipients = mhc_compare.set_inputs_csv(df)
            ### limit the input size to 5 recipient and 5 donors for demo version
            if len(donors) > 5:
                raise ValueError("Too many donors, maximum is 5, for demo version")
            if len(recipients) > 5:
                raise ValueError("Too many recipients, maximum is 5, for demo version")

            fastapi_logger.info(f"Job {job_id}: Created data processed, donors and recipients set")
        else:
            raise ValueError("No data provided")

    except Exception as e:
        error_message = f"Error in process_upload for job {job_id}: {str(e)}"
        fastapi_logger.error(error_message)
        fastapi_logger.error(traceback.format_exc())
        job_store[job_id] = {"status": "error", 
                             "result": {"error": str(e)},
                             "completion_time": datetime.now()}
        return


    # For the methods performing the actual analysis, we don't need to return a detailed error message, just something about internal server error
    try:
        fastapi_logger.info(f"Job {job_id}: Checking allele availability")
        mhc_compare.check_alleles()
        
        fastapi_logger.info(f"Job {job_id}: Classifying haplotypes")
        donors, recipients = mhc_compare.classify_haplotypes()

        fastapi_logger.info(f"Job {job_id}: Grouping alleles")
        mhc_compare.group_alleles()

        fastapi_logger.info(f"Job {job_id}: Calculating MHC difference")
        mhc_compare.calcMHCDifference()

        fastapi_logger.info(f"Job {job_id}: Calculating average SAS scores")
        mhc_compare.average_sas_scores()

        fastapi_logger.info(f"Job {job_id}: Filtering by SAS with rsa threshold {rsa}")
        #print("RSA: ", rsa)
        mhc_compare.filter_by_sas(rsa)
        
        fastapi_logger.info(f"Job {job_id}: Checking known eplets")
        eplets_found = mhc_compare.check_known_eplets()
        with open(f"results/eplets_found.json", "w") as f:
            json.dump(eplets_found, f)

        ### Gather results ###

        fastapi_logger.info(f"Job {job_id}: Generating ranking data")
        ranking_data = data_exporter.generate_ranking_data(mhc_compare.donors, mhc_compare.recipients, mhc_compare.difference_scoring)
        # write the ranking data to a json file
        with open(f"results/ranking_data.json", "w") as f:
            json.dump(ranking_data, f)

        fastapi_logger.info(f"Job {job_id}: Creating entity info")
        entity_info = data_exporter.create_entity_info(mhc_compare.donors,mhc_compare.recipients)

        fastapi_logger.info(f"Job {job_id}: Determining relevant classes")
        relevant_classes = mhc_compare.get_relevant_classes()

        fastapi_logger.info(f"Job {job_id}: Generating alignment data")
        alignment_data = data_exporter.get_aligned_seqs(mhc_compare.donors, mhc_compare.recipients)


        fastapi_logger.info(f"Job {job_id}: Generating output files")
        output_files = {
            "input": data_exporter.export_input(mhc_compare.donors, mhc_compare.recipients, relevant_classes),
            "alignment": data_exporter.export_alignment(mhc_compare.donors, mhc_compare.recipients, relevant_classes),
            "sas_scores": data_exporter.export_sas_scores(mhc_compare.sas_scores, relevant_classes),
            "mismatches": data_exporter.export_mismatches(mhc_compare.difference_scoring, relevant_classes),
            "eplets": data_exporter.export_known_eplets(eplets_found, relevant_classes)
        }


        stop_time = time.time()
        execution_time = stop_time - start_time

        fastapi_logger.info(f"Job {job_id}: Preparing result")
        result = {
            "message": "File uploaded successfully", 
            "data": mhc_compare.difference_scoring,
            "donors": mhc_compare.donors,
            "recipients": mhc_compare.recipients,
            "alignment": alignment_data,
            "ranking": ranking_data,
            "entity_info": entity_info,
            "execution_time": execution_time,
            "grouped_sas_scores": mhc_compare.sas_scores,
            "eplets_found": eplets_found,
            "classes_to_show": relevant_classes,
            "output_files": output_files,
            "invalid_alleles": mhc_compare.invalid_alleles,
            "transformed_alleles": mhc_compare.transformed_alleles
        }

        job_store[job_id] = {"status": "completed", 
                             "result": result,
                             "completion_time": datetime.now()}
        fastapi_logger.info(f"Job {job_id} completed successfully")
    except Exception as e:
        error_message = f"Error in process_upload for job {job_id}: {str(e)}"
        fastapi_logger.error(error_message)
        fastapi_logger.error(traceback.format_exc())
        job_store[job_id] = {"status": "error", 
                             "result": {"error": "Internal server error"},
                             "completion_time": datetime.now()}


@app.get("/docs/{path:path}")
async def serve_docs(path: str):
    return FileResponse(f"docs/build/html/{path}")


@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API route not found")
    else:
        return FileResponse("frontend/build/index.html")
    

if __name__ == "__main__":
    # Use 0.0.0.0 to make it accessible from outside localhost (required for Docker and cloud deployment)
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)