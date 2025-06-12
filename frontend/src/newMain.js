import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Download, BookOpen, Link} from 'lucide-react';
import axios from 'axios';
import DonorTable, { RecipientTable } from './tables';
import './App.css';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Button, TextField, Autocomplete, IconButton, Tabs, Tab, Box, Paper, Typography, Stack, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { API_BASE_URL } from './config';

import AlignmentTab from './Tabs/AlignmentTab';
import SASTab from './Tabs/SASTab';
import MismatchTab from './Tabs/MismatchTab';
import EpletTab from './Tabs/EpletTab';
import RankingTab from './Tabs/RankingTab';
import ContactSection from './ContactSection';


export const DocLink = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="doc-link"
  >
    {children}
    <Link size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
  </a>
);


const StyledTab = styled(Tab)(({ theme }) => ({

  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 2,
    backgroundColor: 'transparent',
    transition: 'background-color 0.3s',
  },
  '&:hover': {
    color: theme.palette.primary.light,
    opacity: 1,
    backgroundColor: 'transparent',
    '&::after': {
      backgroundColor: theme.palette.primary.light,
    },
  },
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    '&::after': {
      backgroundColor: theme.palette.primary.main,
    },
  },
}));

let allelesCache = null;

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main,
}));

// Function to check if the created data is empty
const isEmptyCreatedData = (data) => {
  // check if all the donors alleles and recipients alleles are empty
  return data.every(d => d.alleles.length === 0);
};

function AlternativeLayout() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [inputMethod, setInputMethod] = useState('file');
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [fileName, setFileName] = useState('No file selected');
  const [entityInfo, setEntityInfo] = useState(null);
  const [rsa, setRsa] = useState('0.25');
  const [rsaError, setRsaError] = useState(null);
  const [inputSubmissionStatus, setInputSubmissionStatus] = useState(null);
  const [inputErrorMessage, setInputErrorMessage] = useState(null);
  const [donors, setDonors] = useState([{ id: 'Donor1', alleles: [] }]);
  const [recipients, setRecipients] = useState([{ id: 'Recipient1', alleles: [] }]);
  const [alleles, setAlleles] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  const [classesToShow, setClassesToShow] = useState([]);

  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [jobQueuePosition, setJobQueuePosition] = useState(null);
  

  // Add state variables for each tab
  const [AlignmentTabData, setAlignmentTabData] = useState({});
  const [SAScoresTabData, setSAScoresTabData] = useState({});
  const [MismatchesTabData, setMismatchesTabData] = useState({});
  const [EpletTabData, setEpletTabData] = useState({});
  const [RankingTabData, setRankingTabData] = useState({});


  const pollForResults = useCallback(async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/poll_results/${id}`);
      if (response.data.status === 'completed') {
        setResponseData(response.data.result);
        setEntityInfo(response.data.result.entity_info);
        setExecutionTime(response.data.result.execution_time);
        setInputSubmissionStatus("success");
        setClassesToShow(response.data.result.classes_to_show);
        setIsLoading(false);
        setJobId(null);
        setJobStatus(null);
        setJobQueuePosition(null);
      } else if (response.data.status === 'processing') {
        setJobStatus('active');
        setTimeout(() => pollForResults(id), 2000);
      } else if (response.data.status === 'queued') {
        setJobStatus('queued');
        setJobQueuePosition(response.data.queue_position);
        setTimeout(() => pollForResults(id), 2000);

      } else if (response.data.status === 'error') {
        setInputSubmissionStatus("error");
        console.log("response data", response.data);
        setInputErrorMessage(response.data.error || "An error occurred while processing your request.");
        setIsLoading(false);
        setJobId(null);
        setJobStatus(null);
        setJobQueuePosition(null);
      } else {
        throw new Error('Unexpected status');
      }
    } catch (error) {
      console.error('Error polling for results:', error);
      setInputSubmissionStatus("error");
      if (error.response?.status === 503) {
        setInputErrorMessage("The server is currently busy. Please try again later.");
      } else {
        setInputErrorMessage(error.response?.data?.result?.error || error.message || "An error occurred while retrieving results. Please try again.");
      }
      setIsLoading(false);
      setJobId(null);
      setJobStatus(null);
      setJobQueuePosition(null);
    }
  }, []);

  useEffect(() => {
    if (jobId) {
      pollForResults(jobId);
    }
  }, [jobId, pollForResults]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const fetchAlleles = useCallback(async () => {
    if (allelesCache) {
      setAlleles(allelesCache);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/allele_ids`);
      allelesCache = response.data;
      setAlleles(allelesCache);
      console.log(response.data)
    } catch (error) {
      console.error('Error fetching alleles:', error);
    }
  }, []);

  useEffect(() => {
    fetchAlleles();
  }, [fetchAlleles]);

  useEffect(() => {
    if (inputMethod === 'create' && donors.length === 0 && recipients.length === 0) {
      // Initialize with one donor and one recipient when switching to create mode
      setDonors([{ id: 'Donor1', alleles: [] }]);
      setRecipients([{ id: 'Recipient1', alleles: [] }]);
    }
  }, [inputMethod, donors.length, recipients.length]);
  
  useEffect(() => {
    console.log('Current API base URL:', API_BASE_URL);
  }, []);

  const getNextAvailableId = (prefix, currentList) => {
    const usedNumbers = currentList.map(item => 
      parseInt(item.id.replace(prefix, ''))
    );
    for (let i = 1; i <= currentList.length + 1; i++) {
      if (!usedNumbers.includes(i)) {
        return `${prefix}${i}`;
      }
    }
  };

  const addDonor = () => {
    const newId = getNextAvailableId('Donor', donors);
    setDonors([...donors, { id: newId, alleles: [] }]);
  };

  const addRecipient = () => {
    const newId = getNextAvailableId('Recipient', recipients);
    setRecipients([...recipients, { id: newId, alleles: [] }]);
  };

  

  const handleRsaChange = (event) => {
    const value = event.target.value.replace(',', '.');
    
    // Allow empty input for user convenience while typing
    if (value === '') {
      setRsa(value);
      setRsaError(null);
      return;
    }

    // Check if the input is a valid number between 0 and 1
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 1 && /^\d*\.?\d*$/.test(value)) {
      setRsa(value);
      setRsaError(null);
    } else {
      setRsa(value);  // Still update the input for UX, but set an error
      setRsaError("RSA must be a number between 0 and 1");
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    } else {
      setSelectedFile(null);
      setFileName('No file selected');
    }
  };
  
  const handleInputMethodChange = (value) => {
    setInputMethod(value);
    if (value === 'create' && donors.length === 0 && recipients.length === 0) {
      addDonor();
      addRecipient();
    }
  };

  const handleSubmit = async () => {
    if (rsaError || rsa === '' || isNaN(parseFloat(rsa))) {
      setInputSubmissionStatus("error");
      setInputErrorMessage("Please enter a valid RSA value between 0 and 1.");
      return;
    }

    setIsLoading(true);
    setInputSubmissionStatus(null);
    setInputErrorMessage(null);
    setResponseData(null); // Reset the response data when starting a new submission
    // resest the tab states
    setAlignmentTabData({});
    setSAScoresTabData({});
    setMismatchesTabData({});

    const formData = new FormData();
    
    if (inputMethod === 'file' && selectedFile) {
      formData.append('file', selectedFile);
    } else if (inputMethod === 'create') {
      const data = {
        donors: donors.map(donor => ({ identifier: donor.id, type: "Donor", alleles: donor.alleles })),
        recipients: recipients.map(recipient => ({ identifier: recipient.id, type: "Recipient", alleles: recipient.alleles }))
      };
      formData.append('created_data', JSON.stringify(data));
    }

    formData.append('rsa', parseFloat(rsa));  // Ensure we send a number

    try {
      const response = await axios.post(`${API_BASE_URL}/job_submission`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'queued') {
        setJobId(response.data.id);
        setJobStatus('queued');
        setInputSubmissionStatus("pending");
        // setInputErrorMessage("Your request has been queued. Please wait...");
        console.log("Request queued with ID:", response.data.id);
      } else {
        // Handle immediate response (unlikely with the new setup)
        setResponseData(response.data);
        setEntityInfo(response.data.entity_info);
        setExecutionTime(response.data.execution_time);
        setInputSubmissionStatus("success");
        setClassesToShow(response.data.classes_to_show);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setInputSubmissionStatus("error");
      setInputErrorMessage(error.response?.data?.detail || error.message || "An unknown error occurred");
      setIsLoading(false);
    }
  };

  const theme = createTheme({
    components: {
      MuiAutocomplete: {
        styleOverrides: {
          popper: {
            zIndex: 9999,
          },
        },
      },
    },
  });

  const handleExport = async () => {
    if (responseData) {
      const zip = new JSZip();

      const excelFolder = zip.folder("results_excel");
      const csvFolder = zip.folder("results_csv");

      // Add the excel files to the zip
      const export_files = responseData.output_files
      console.log("export files", export_files)
      excelFolder.file("Alignment.xlsx", export_files.alignment.excel, {base64: true});
      excelFolder.file("Input.xlsx", export_files.input.excel, {base64: true});
      excelFolder.file("Mismatches.xlsx", export_files.mismatches.excel, {base64: true});
      excelFolder.file("SAS_scores.xlsx", export_files.sas_scores.excel, {base64: true});
      excelFolder.file("KnownEplets.xlsx", export_files.eplets.excel, {base64: true});

      // Add the csv files to the zip
      // loop over the keys of export_files.alignment.csv
      for (const key in export_files.alignment.csv) {
        csvFolder.file("Alignment_" + key + ".csv", export_files.alignment.csv[key], {base64: true});
      }
      for (const key in export_files.input.csv) {
        csvFolder.file("Input_" + key + ".csv", export_files.input.csv[key], {base64: true});
      }
      for (const key in export_files.mismatches.csv) {
        csvFolder.file("Mismatches_" + key + ".csv", export_files.mismatches.csv[key], {base64: true});
      }
      for (const key in export_files.sas_scores.csv) {
        csvFolder.file("SAS_scores_" + key + ".csv", export_files.sas_scores.csv[key], {base64: true});
      }
      for (const key in export_files.eplets.csv) {
        csvFolder.file("KnownEplets_" + key + ".csv", export_files.eplets.csv[key], {base64: true});
      }

      zip.generateAsync({ type: "blob" })
        .then(function (content) {
          saveAs(content, "hmc_matchmaker_results.zip");
        });
    }
  };


  // filter options for autocomplete
  const filterOptions = createFilterOptions({
    limit: 2000,
    ignoreCase: true,
    matchFrom: 'start',
  });

  return (
    <ThemeProvider theme={theme}>
      <div className="container-wide">
        <header className="app-header">
          <div className="title-wrapper">
            <h1>MHC Matchmaker</h1>
          </div>
          <Button
            variant="outlined"
            startIcon={<BookOpen size={18} />}
            href={`${API_BASE_URL}/docs/index.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="doc-button"
          >
            Documentation
          </Button>
        </header>

        {/* <DBFetcher /> */}

        {/* <div className="section-separator"></div> */}
        
        <StyledPaper elevation={3}>
          <StyledTypography variant="h5" component="h2">
            Input MHC Data
          </StyledTypography>
          <Stack container spacing={3}>
            <Stack item xs={12}>
              <div className="input-options">
                <label>
                  <input
                    type="radio"
                    name="inputMethod"
                    value="file"
                    checked={inputMethod === 'file'}
                    onChange={() => handleInputMethodChange('file')}
                  />
                  Upload File
                </label>
                <label>
                  <input
                    type="radio"
                    name="inputMethod"
                    value="create"
                    checked={inputMethod === 'create'}
                    onChange={() => handleInputMethodChange('create')}
                  />
                  Create Data
                </label>
              </div>
            </Stack>
            <Stack item xs={12}>
              {inputMethod === 'file' ? (
                <div className="file-input-wrapper">
                  <label htmlFor="file-upload">Choose File</label>
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  />
                  <span className="file-name">{fileName}</span>
                  <div className="input-instructions-link">
                    For example input <a href="/input-instructions" target="_blank" rel="noopener noreferrer">Click here</a>
                  </div>
                </div>
              ) : (
                <div className="create-data-section">
                  <h3>Donors</h3>
                  {donors.map((donor, index) => (
                    <div key={index} className="entity-input">
                      <TextField
                        value={donor.id}
                        onChange={(e) => {
                          const newDonors = [...donors];
                          newDonors[index].id = e.target.value;
                          setDonors(newDonors);
                        }}
                        label="Donor Name"
                        variant="outlined"
                        style={{ width: '200px', marginRight: '10px' }}
                      />
                      <Autocomplete
                        multiple
                        options={alleles}
                        value={donor.alleles}
                        renderInput={(params) => <TextField {...params} label="Donor Alleles" />}
                        onChange={(event, newValue) => {
                          const newDonors = [...donors];
                          newDonors[index].alleles = newValue;
                          setDonors(newDonors);
                        }}
                        style={{ flexGrow: 1, marginRight: '10px' }}
                        filterOptions={filterOptions}
                      />
                      <IconButton onClick={() => {
                        const newDonors = donors.filter((_, i) => i !== index);
                        setDonors(newDonors);
                      }} aria-label="delete">
                        <CloseIcon />
                      </IconButton>
                    </div>
                  ))}
                  <Button onClick={() => setDonors([...donors, { id: `Donor${donors.length + 1}`, alleles: [] }])}>
                    Add Donor
                  </Button>

                  <h3>Recipients</h3>
                  {recipients.map((recipient, index) => (
                    <div key={index} className="entity-input">
                      <TextField
                        value={recipient.id}
                        onChange={(e) => {
                          const newRecipients = [...recipients];
                          newRecipients[index].id = e.target.value;
                          setRecipients(newRecipients);
                        }}
                        label="Recipient Name"
                        variant="outlined"
                        style={{ width: '200px', marginRight: '10px' }}
                      />
                      <Autocomplete
                        multiple
                        options={alleles}
                        value={recipient.alleles}
                        renderInput={(params) => <TextField {...params} label="Recipient Alleles" />}
                        onChange={(event, newValue) => {
                          const newRecipients = [...recipients];
                          newRecipients[index].alleles = newValue;
                          setRecipients(newRecipients);
                        }}
                        style={{ flexGrow: 1, marginRight: '10px' }}
                        filterOptions={filterOptions}
                      />
                      <IconButton onClick={() => {
                        const newRecipients = recipients.filter((_, i) => i !== index);
                        setRecipients(newRecipients);
                      }} aria-label="delete">
                        <CloseIcon />
                      </IconButton>
                    </div>
                  ))}
                  <Button onClick={() => setRecipients([...recipients, { id: `Recipient${recipients.length + 1}`, alleles: [] }])}>
                    Add Recipient
                  </Button>
                </div>
              )}
            </Stack>
            <Stack item xs={12}>
              <TextField
                label="Relative Solvent Accessibility (RSA) threshold"
                type="text"
                value={rsa}
                onChange={handleRsaChange}
                error={!!rsaError}
                helperText={rsaError}
                style={{width: '300px'}}
              />
            </Stack>
            <Stack item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={(inputMethod === 'file' && !selectedFile) || isLoading || (inputMethod === 'create' && isEmptyCreatedData(donors)) || (inputMethod === 'create' && isEmptyCreatedData(recipients))} // also disable when donors and recipients are empty if data creating
                startIcon={isLoading ? <span className="spinner"></span> : <Upload />}
                fullWidth = {false}
              >
                {isLoading ? "Processing..." : "Submit"}
              </Button>
            </Stack>
          </Stack>
          
          {/* {inputSubmissionStatus === 'success' && (
            <div className="success-message">
              File has been processed successfully!
            </div>
          )} */}

          {inputSubmissionStatus === 'error' && (
            <div className="error-message">
              {inputErrorMessage || "An error occurred while processing the file. Please try again."}
            </div>
          )}

          {inputSubmissionStatus === 'pending' && (
            <div className="pending-message">
              {inputErrorMessage}
            </div>
          )}

          {/* Add this new section to display invalid and transformed alleles side by side */}
          {responseData && (responseData.invalid_alleles?.length > 0 || Object.keys(responseData.transformed_alleles || {}).length > 0) && (
            <div className="alleles-info-container">
              {responseData.invalid_alleles?.length > 0 && (
                <div className="invalid-alleles-section">
                  <h4>Invalid Alleles <DocLink href={`${API_BASE_URL}/docs/overview.html#input`}/></h4>
                  <ul>
                    {responseData.invalid_alleles.map((allele, index) => (
                      <li key={index}>{allele}</li>
                    ))}
                  </ul>
                </div>
              )}
              

              {Object.keys(responseData.transformed_alleles || {}).length > 0 && (
                <div className="transformed-alleles-section">
                  <h4>Transformed Alleles <DocLink href={`${API_BASE_URL}/docs/overview.html#input`}/></h4>
                  <ul>
                    {Object.entries(responseData.transformed_alleles).map(([original, transformed], index) => (
                      <li key={index}>{original} → {transformed}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {jobId && (
            <Paper elevation={3} sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#333', fontWeight: 'bold' }}>
                Job Status
              </Typography>
              <Stack spacing={1}>
                <Box display="flex" alignItems="center">
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mr: 1 }}>Job ID:</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', backgroundColor: '#e0e0e0', padding: '2px 6px', borderRadius: '4px' }}>
                    {jobId}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mr: 1 }}>Status:</Typography>
                  <Chip
                    label={jobStatus === 'active' ? 'Active' : 'Queued'}
                    color={jobStatus === 'active' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
                {jobStatus === 'queued' && jobQueuePosition && (
                  <Box display="flex" alignItems="center">
                    <Typography variant="body1" sx={{ fontWeight: 'medium', mr: 1 }}>Queue Position:</Typography>
                    <Chip label={jobQueuePosition} color="primary" size="small" />
                  </Box>
                )}
              </Stack>
            </Paper>
          )}
        </StyledPaper>

        {responseData && !isLoading && <div className="section-separator"></div>}

        {responseData && !isLoading && (
          <div className="response-section">

            <div className='success-message'>
              Results have been successfully generated!
            </div>
            <div className="execution-time-export">
              {executionTime && (
                <div className="execution-time">
                  <p><strong>Runtime:</strong> {executionTime.toFixed(2)} seconds</p>
                </div>
              )}
              <button onClick={handleExport} className="export-button">
                <Download size={18} style={{marginRight: '8px'}} /> Download Results
              </button>
            </div>

              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange} 
                  aria-label="result tabs"
                  TabIndicatorProps={{
                    sx: { display: 'none' },
                  }}
                >
                  <StyledTab label="Input" />
                  <StyledTab label="Alignment" />
                  <StyledTab label="Solvent Accessibility Scores"/>
                  <StyledTab label="Mismatches" />
                  <StyledTab label="Eplets" />
                  <StyledTab label="Rankings" />
                </Tabs>
              </Box>

              <TabPanel value={activeTab} index={0}>
                {/*  Add an introduction text here                */}
                
                <h3>Donors</h3>
                <DonorTable donors={responseData.donors} classesToShow={classesToShow} />
              <h3>Recipients</h3>
              <RecipientTable recipients={responseData.recipients} classesToShow={classesToShow} />
            </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <AlignmentTab 
                  sequences={responseData.alignment} 
                  donors={responseData.donors}
                  recipients={responseData.recipients}
                  tabState={AlignmentTabData}
                  setTabState={setAlignmentTabData}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                
                <SASTab 
                  entityInfo={entityInfo} 
                  rsa={rsa} 
                  SAScoresTabData={SAScoresTabData} 
                  setSAScoresTabData={setSAScoresTabData}
                  responseData={responseData}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                <MismatchTab 
                  responseData={responseData} 
                  classesToShow={classesToShow} 
                  MismatchesTabData={MismatchesTabData} 
                  setMismatchesTabData={setMismatchesTabData}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={4}>
                <EpletTab 
                  epletData={responseData.eplets_found} 
                  donors={responseData.donors} 
                  recipients={responseData.recipients} 
                  classesToShow={classesToShow} 
                  tabState={EpletTabData} 
                  setTabState={setEpletTabData}
                  entityInfo={entityInfo}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={5}>
                <RankingTab 
                  rankingData={responseData.ranking}
                  recipients={responseData.recipients}
                  classesToShow={classesToShow}
                  tabState={RankingTabData}
                  setTabState={setRankingTabData}
                />
              </TabPanel>
              </div>
        )}

       
        <ContactSection />

      </div>
    </ThemeProvider>
  );
}


function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default AlternativeLayout;