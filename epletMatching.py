import logging
import json
from database import get_database
# set up basic logging
logger = logging.getLogger(__name__)
from tqdm import tqdm



def create_eplet_dict(eplets_dict):
    """
    Create a dictionary with the first eplet position as keys and lists of eplet ids as values

    Parameters:
    eplets_dict: a dictionary with the eplet ids as keys and the eplet data as values, eplet data is a dictionary with the position as key and the base as value

    Returns:
    eplet_dict: a dictionary with the first eplet position as keys and lists of eplet ids as values
    """
    eplet_dict = {}
    for eplet_id, eplet_data in eplets_dict.items():
        # get the sorted smallest position in the eplet_data keys
        pos = sorted(eplet_data.keys())[0]
        for pos in eplet_data.keys():
            if pos not in eplet_dict:
                eplet_dict[pos] = []
            eplet_dict[pos].append(eplet_id)

    # the length of eplet_dict should be the same as the sum of all the lenght of the values
    # sum_of_values = sum(len(v) for v in eplet_dict.values())
    # assert sum_of_values == len(eplets_dict), "The number of eplets in the eplet_dict is not the same as the number of eplets in the eplets_dict"
    return eplet_dict


def check_eplet_presence(allele, update_db=False):
    """
    Give an allele, check if it has a known eplet in it,
    If so, return the a list of the eplet ids, can also update the db with the eplet ids.

    Parameters:
    allele: the allele to check
    update_db: if True, update the db with the eplet ids

    Returns:
    eplet_ids: a list of the eplet ids
    """

    file_paths = {
        "IIDRB": "data/eplets/eplets_DRB.json",
        "IIDQ": "data/eplets/eplets_DQ.json",
        "I": "data/eplets/eplets_I.json"
    }

    db = get_database()


    # Check the allele class
    cls = db.get_allele_class(allele)
    if cls == "IIDQA" or cls == "IIDQB":
        cls = "IIDQ"
    
    # no eplets for IIDRA class
    if cls not in file_paths:
        return []

    # load the known eplets
    with open(file_paths[cls], "r") as f:
        eplets_dict = json.load(f)
    
    # create eplet position dict
    eplet_pos = create_eplet_dict(eplets_dict)

    # check the aligned sequences for the eplet presence
    aligned_seq = db.find(allele).aligned_seq

    eplet_ids = []
    
    
    for i, val in enumerate(aligned_seq):
        # eplets are 1-indexed
        i += 1
        i = str(i)
        # check if the current position is in the eplet_pos dict
        if i in eplet_pos:
            # get the list of eplet ids for this position
            eplet_ids_for_pos = eplet_pos[i]
            #print(i,eplet_ids_for_pos)
            # loop over all the eplet ids that start with the current position
            for eplet_id in eplet_ids_for_pos:
                if eplet_id not in eplet_ids:   
                    # get the eplet data
                    eplet_data = eplets_dict[eplet_id]
                    # for each position in the eplet data, check if the base matches the aligned sequence
                    is_eplet = True
                    for pos, val_eplet in eplet_data.items():
                        # pos is 1-indexed, so convert to 0-indexed 
                        pos = int(pos)-1
                        if aligned_seq[pos] != val_eplet:
                            is_eplet = False
                            break
                    if is_eplet:
                        eplet_ids.append(eplet_id)
    

    if update_db and eplet_ids != []:
        db.update_eplet_presence(allele, eplet_ids)

    return eplet_ids


def update_eplets_db():
    """
    Goes over all the alleles in the db and check each allele for eplet presence.
    If an allele has an eplet, the eplet ids are added to the allele object and the db is updated.

    """

    db = get_database()

    # get all the alleles in the db
    alleles = db.get_all_ids()

    # go over all the alleles and check for eplet presence
    for i in tqdm(range(0,len(alleles))):
        allele = alleles[i]
        # print(allele)
        check_eplet_presence(allele, update_db=True)

    return

                
if __name__ == "__main__":
    
    update_eplets_db()