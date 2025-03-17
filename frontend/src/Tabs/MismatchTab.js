import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer,Typography,TableHead, TableRow, Paper, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Tooltip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

import { DocLink } from '../newMain.js';
import { API_BASE_URL } from '../config.js';


export function DetailedMismatchView({ data, recipients, donors, classesToShow, tabState, setTabState }) {
    const [selectedRecipient, setSelectedRecipient] = useState(tabState?.selectedRecipient || Object.keys(recipients)[0] || '');
    const [selectedDonor, setSelectedDonor] = useState(tabState?.selectedDonor || Object.keys(donors)[0] || '');
    const [selectedClass, setSelectedClass] = useState(tabState?.selectedClass || classesToShow[0] || '');
    const [showOnlyRelevantDonor, setShowOnlyRelevantDonor] = useState(tabState?.showOnlyRelevantDonor || false);
    const [showOnlyRelevantRecipient, setShowOnlyRelevantRecipient] = useState(tabState?.showOnlyRelevantRecipient || false);
    
    const handleRecipientChange = (event) => {
      setSelectedRecipient(event.target.value);
      
      setTabState(prevState => ({...prevState, selectedRecipient: event.target.value}))
    };
  
    const handleDonorChange = (event) => {
      setSelectedDonor(event.target.value);
      
      setTabState(prevState => ({...prevState,selectedDonor:event.target.value,selectedClass:''}))
    };
  
    const handleClassChange = (event) => {
      setSelectedClass(event.target.value);
      setTabState(prevState => ({...prevState, selectedClass: event.target.value}))
    };
  
    const handleShowOnlyRelevantDonorChange = (event) => {
      const newValue = event.target.checked;
      setShowOnlyRelevantDonor(newValue);
      if (newValue) {
        setShowOnlyRelevantRecipient(false);
      }
      setTabState(prevState => ({
        ...prevState,
        showOnlyRelevantDonor: newValue,
        showOnlyRelevantRecipient: newValue ? false : prevState.showOnlyRelevantRecipient
      }));
    };
  
    const handleShowOnlyRelevantRecipientChange = (event) => {
      const newValue = event.target.checked;
      setShowOnlyRelevantRecipient(newValue);
      if (newValue) {
        setShowOnlyRelevantDonor(false);
      }
      setTabState(prevState => ({
        ...prevState,
        showOnlyRelevantRecipient: newValue,
        showOnlyRelevantDonor: newValue ? false : prevState.showOnlyRelevantDonor
      }));
    };
  
    const getMismatches = () => {
      if (selectedRecipient && selectedDonor && selectedClass) {
        return data[selectedRecipient][selectedDonor][selectedClass];
      }
      return null;
    };
  
    const mismatches = getMismatches();

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Recipient</InputLabel>
              <Select value={selectedRecipient} onChange={handleRecipientChange} label="Recipient">
                {Object.keys(recipients).map((recipientId) => (
                  <MenuItem key={recipientId} value={recipientId}>{recipientId}</MenuItem>
                ))}
              </Select>
            </FormControl>
  
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Donor</InputLabel>
              <Select 
                value={selectedDonor} 
                onChange={handleDonorChange} 
                label="Donor"
              >
                {Object.keys(donors).map((donorId) => (
                  <MenuItem key={donorId} value={donorId}>{donorId}</MenuItem>
                ))}
              </Select>
            </FormControl>
  
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Class</InputLabel>
              <Select 
                value={selectedClass} 
                onChange={handleClassChange} 
                label="Class"
              >
                {classesToShow.map((cls) => (
                  <MenuItem key={cls} value={cls}>{`Class ${cls}`}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          
          <div>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showOnlyRelevantDonor}
                  onChange={handleShowOnlyRelevantDonorChange}
                  name="showOnlyRelevantDonor"
                />
              }
              label={
                <span>
                  RSA filtered Donor mism.
                  <Tooltip title="Show only the donor mismatches for positions that are solvent accessible in the donor alleles" arrow>
                    <InfoIcon fontSize="small" style={{ marginLeft: '5px', verticalAlign: 'middle', color: '#666' }} />
                  </Tooltip>
                </span>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showOnlyRelevantRecipient}
                  onChange={handleShowOnlyRelevantRecipientChange}
                  name="showOnlyRelevantRecipient"
                />
              }
              label={
                <span>
                  RSA filtered Recipient mism.
                  <Tooltip title="Show only the recipient mismatches for positions that are solvent accessible in the recipient alleles" arrow>
                    <InfoIcon fontSize="small" style={{ marginLeft: '5px', verticalAlign: 'middle', color: '#666' }} />
                  </Tooltip>
                </span>
              }
            />
          </div>
        </div>
  
        {mismatches ? (
          mismatches.donor_diff.some((donorMismatch, index) => 
            donorMismatch.length > 0 || mismatches.recip_diff[index].length > 0
          ) ? (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} size="small" aria-label="detailed mismatch table">
                <TableHead>
                  <TableRow>
                    <TableCell>Position</TableCell>
                    <TableCell>Mismatches donor
                      <Tooltip title={
                        <div style={{whiteSpace: 'pre-line'}}>{
                          "Amino Acids present in donor alleles not in recipient alleles"
                        }</div>
                      } arrow>
                        <InfoIcon fontSize="small" style={{ marginLeft: '5px', verticalAlign: 'middle', color: '#666' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell>Mismatches recipient
                    <Tooltip title={
                        <div style={{whiteSpace: 'pre-line'}}>{
                          "Amino Acids present in recipient alleles not in donor alleles"
                        }</div>
                      } arrow>
                        <InfoIcon fontSize="small" style={{ marginLeft: '5px', verticalAlign: 'middle', color: '#666' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      Donor mismatch significance
                      <Tooltip data-html= "true" title={
                        <div style={{whiteSpace: 'pre-line'}}>{
                          "Ratio of donor alleles that possess this mismatch."
                          + "\n"
                        + "Green indicates that mismatch is solvent accessible."
                        + "\n" 
                        + "Red  indicates it is solvent inaccessible"
                        }</div>
                      }
                          arrow>
                        <InfoIcon fontSize="small" style={{ marginLeft: '5px', verticalAlign: 'middle', color: '#666' }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      Recipient mismatch significance
                      <Tooltip title={
                        <div style={{whiteSpace: 'pre-line'}}>{
                          "Ratio of recipient alleles that possess this mismatch."
                          + "\n"
                          + "Green indicates that mismatch is solvent accessible."
                          + "\n"
                          + "Red  indicates it is solvent inaccessible"
                        }</div>
                      } arrow>
                        <InfoIcon fontSize="small" style={{ marginLeft: '5px', verticalAlign: 'middle', color: '#666' }} />
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mismatches.donor_diff.map((donorMismatch, index) => {
                    const recipMismatch = mismatches.recip_diff[index];
                    const isRelevantDonor = mismatches.updated_mismatches[index] && mismatches.updated_mismatches[index].length > 0;
                    const isRelevantRecipient = mismatches.updated_recip_mismatches[index] && mismatches.updated_recip_mismatches[index].length > 0;
                    if (showOnlyRelevantDonor && !isRelevantDonor) return null;
                    if (showOnlyRelevantRecipient && !isRelevantRecipient) return null;
  
                    // Calculate donor significance
                    const donorSignificance = donorMismatch.length > 0
                      ? donorMismatch.reduce((sum, allele) => sum + (mismatches.all_donor_diff_ratios[index][allele] || 0), 0)
                      : 0;
  
                    // Calculate recipient significance
                    const recipSignificance = recipMismatch.length > 0
                      ? recipMismatch.reduce((sum, allele) => sum + (mismatches.all_recip_diff_ratios[index][allele] || 0), 0)
                      : 0;
  
                    const textColorDonor = isRelevantDonor ? 'success.main' : 'error.main';
                    const textColorRecipient = isRelevantRecipient ? 'success.main' : 'error.main';
  
                    return (
                      (donorMismatch.length > 0 || recipMismatch.length > 0) && (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{donorMismatch.join(', ')}</TableCell>
                          <TableCell>{recipMismatch.join(', ')}</TableCell>
                          <TableCell sx={{ color: textColorDonor }}>
                            {donorSignificance > 0 ? donorSignificance.toFixed(2) : ''}
                          </TableCell>
                          <TableCell sx={{ color: textColorRecipient }}>
                            {recipMismatch.length > 0 ? recipSignificance.toFixed(2) : ''}
                          </TableCell>
                        </TableRow>
                      )
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">No mismatches found for the selected combination.</Typography>
            </Paper>
          )
        ) : (
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Please select a recipient, donor, and class to view mismatches.</Typography>
          </Paper>
        )}
      </div>
    );
  }

function MismatchTab({responseData, classesToShow, MismatchesTabData, setMismatchesTabData}){
    return(
        <div>
            <h3>Mismatches <DocLink href={`${API_BASE_URL}/docs/overview.html#counting-initial-mismatches`} /></h3>
            <DetailedMismatchView 
                data={responseData.data} 
                recipients={responseData.recipients} 
                donors={responseData.donors}
                classesToShow={classesToShow}
                tabState={MismatchesTabData}
                setTabState={setMismatchesTabData}
            />
        </div>
    )
}

export default MismatchTab;