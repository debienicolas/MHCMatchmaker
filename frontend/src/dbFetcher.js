import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Autocomplete, TextField } from '@mui/material';
import { Upload,Search } from 'lucide-react';
import {DatabaseTable} from './tables';
import { API_BASE_URL } from './config';
import { createFilterOptions } from '@mui/material/Autocomplete';



export default function DBFetcher() {


    // Fetch a list of all allele ids for the database autocomplete dropdown menu
    const [allAlleles, setAllAlleles] = useState([]);
    
    const fetchAllAlleles = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/allele_ids`);
          setAllAlleles(response.data);
        } catch (error) {
          console.error('Error fetching alleles:', error);
        }
    };

    useEffect(() => {
        fetchAllAlleles();
    }, []);

    // filter options for autocomplete
  const filterOptions = createFilterOptions({
    limit: 200,
    ignoreCase: true,
        matchFrom: 'start',
    });

    // Fetch a single allele by id

    const [isFetchingAllele, setIsFetchingAllele] = useState(false);
    const [alleleSubmissionStatus, setAlleleSubmissionStatus] = useState(null);
    const [alleleErrorMessage, setAlleleErrorMessage] = useState(null);
    const [alleleId, setAlleleId] = useState('');
    const [alleleData, setAlleleData] = useState(null);


    const handleAlleleFetch = async () => {
        setIsFetchingAllele(true);
        setAlleleData(null);
        setAlleleSubmissionStatus(null);
        setAlleleErrorMessage(null);

        try {
            const response = await axios.get(`${API_BASE_URL}/allele/${alleleId}`);
            if (response.data) {
                setAlleleData(response.data);
                setAlleleSubmissionStatus("success");
            } else {
                setAlleleSubmissionStatus("not_found");
            }
        } catch (error) {
            console.error('Error fetching allele:', error);
            console.error('Error response:', error.response);
            console.error('Error request:', error.request);
            console.error('Error config:', error.config);
            console.error('Error fetching allele:', error);
            console.error('API_BASE_URL:', API_BASE_URL);
            console.error('Full request URL:', `${API_BASE_URL}/allele/${alleleId}`);
            if (error.response && error.response.status === 404) {
                setAlleleSubmissionStatus("not_found");
            } else {
                setAlleleSubmissionStatus("error");
                setAlleleErrorMessage(error.response?.data?.detail || error.message || "An unknown error occurred");
            }
        } finally {
            setIsFetchingAllele(false);
        }
    };

    
    return (<div className="input-section">
          <h2>MHC Matchmaker database</h2>

          <div className="allele-input-wrapper">
            <Autocomplete
              options={allAlleles}
              filterOptions={filterOptions}
              renderInput={(params) => (
                <TextField {...params} label="Enter Allele ID" variant="outlined" />
              )}
              value={alleleId}
              onChange={(event, newValue) => {
                setAlleleId(newValue);
              }}
              freeSolo
              fullWidth
            />
            <button 
              onClick={handleAlleleFetch}
              disabled={!alleleId || isFetchingAllele}
            >
              {isFetchingAllele ? (
                <>
                  <span className="spinner"></span> Fetching
                </>
              ) : (
                <>
                  <Search size={16} /> Fetch Allele
                </>
              )}
            </button>
          </div>

          {alleleSubmissionStatus === 'not_found' && (
            <div className="error-message">
              Allele ID not found in the database. Please try a different ID.
            </div>
          )}

          {alleleSubmissionStatus === 'error' && (
            <div className="error-message">
              {alleleErrorMessage || "An error occurred while fetching allele data. Please try again."}
            </div>
          )}

          {alleleData && (
            <div className="allele-data">
              <h3>Allele Data:</h3>
              <DatabaseTable data={alleleData} />
              {/* <pre>{JSON.stringify(alleleData, null, 2)}</pre> */}
            </div>
          )}
        </div>)
           
}