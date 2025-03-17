import React, { useState, useEffect, useMemo } from 'react';
import { Typography, TableContainer, Table, TableBody, TableHead, TableRow, TableCell, Paper, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

function RankingTab({ rankingData, recipients, classesToShow, tabState, setTabState }) {
  const [selectedRecipient, setSelectedRecipient] = useState(tabState?.selectedRecipient || Object.keys(recipients)[0] || '');
  const [selectedClass, setSelectedClass] = useState(tabState?.selectedClass || classesToShow[0] || '');
  const [mismatchType, setMismatchType] = useState(tabState?.mismatchType || 'donor_mismatches');
  const [rankings, setRankings] = useState(null);

  const handleRecipientChange = (event) => {
    const value = event.target.value;
    setSelectedRecipient(value);
    setTabState(prevState => ({...prevState, selectedRecipient: value}));
  };

  const handleClassChange = (event) => {
    const value = event.target.value;
    setSelectedClass(value);
    setTabState(prevState => ({...prevState, selectedClass: value}));
  };

  const handleMismatchTypeChange = (event) => {
    const value = event.target.value;
    setMismatchType(value);
    setTabState(prevState => ({...prevState, mismatchType: value}));
  };

  useEffect(() => {
    if (selectedRecipient && selectedClass) {
      const data = rankingData[selectedRecipient]?.scores?.[selectedClass];
      console.log('Selected Recipient:', selectedRecipient);
      console.log('Selected Class:', selectedClass);
      console.log('Ranking Data:', data);
      setRankings(data || []);
    } else {
      setRankings(null);
    }
  }, [selectedRecipient, selectedClass, rankingData]);

  const sortedRankings = useMemo(() => {
    if (!rankings) return null;
    return [...rankings].sort((a, b) => {
      if (mismatchType === 'donor_mismatches') {
        return a.mismatches_donor - b.mismatches_donor;
      } else if (mismatchType === 'donor_filtered_mismatches') {
        return a.updated_mismatches_donor - b.updated_mismatches_donor;
      } else if (mismatchType === 'recip_filtered_mismatches') {
        return a.updated_mismatches_recip - b.updated_mismatches_recip;
      } else if (mismatchType === 'recip_mismatches') {
        return a.mismatches_recip - b.mismatches_recip;
      } else {
        return 0;
      }
    });
  }, [rankings, mismatchType]);

  return (
    <div>
      <h3>Ranking</h3>
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
            <InputLabel>Class</InputLabel>
            <Select 
              value={selectedClass} 
              onChange={handleClassChange} 
              label="Class"
              disabled={!selectedRecipient}
            >
              {classesToShow.map((cls) => (
                <MenuItem key={cls} value={cls}>{`Class ${cls}`}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Rank by</InputLabel>
          <Select 
            value={mismatchType} 
            onChange={handleMismatchTypeChange} 
            label="Rank by"
          >
            <MenuItem value="donor_mismatches">Donor Mismatches</MenuItem>
            <MenuItem value="recip_mismatches">Recipient Mismatches</MenuItem>
            <MenuItem value="donor_filtered_mismatches">Donor RSA filtered mismatches</MenuItem>
            <MenuItem value="recip_filtered_mismatches">Recipient RSA filtered mismatches</MenuItem>
          </Select>
        </FormControl>
      </div>

      {sortedRankings ? (
        sortedRankings.length > 0 ? (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} size="small" aria-label="ranking table">
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Donor ID</TableCell>
                  <TableCell>Donor Mismatches</TableCell>
                  <TableCell>Donor RSA filtered mismatches</TableCell>
                  <TableCell>Recipient Mismatches</TableCell>
                  <TableCell>Recipient RSA filtered mismatches</TableCell>
                  <TableCell>Total positions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRankings.map((ranking, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{ranking.donorID}</TableCell>
                    <TableCell>{ranking.mismatches_donor}</TableCell>
                    <TableCell>{ranking.updated_mismatches_donor}</TableCell>
                    <TableCell>{ranking.mismatches_recip}</TableCell>
                    <TableCell>{ranking.updated_mismatches_recip}</TableCell>
                    <TableCell>{ranking.total_sequence_length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>No ranking data available for the selected recipient and class.</Typography>
        )
      ) : (
        <Typography>Please select a recipient and class to view rankings.</Typography>
      )}
    </div>
  );
}

export default RankingTab;
