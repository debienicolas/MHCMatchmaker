import React, { useState, useMemo, useEffect } from 'react';
import { Typography, TableContainer, Table, TableBody, TableHead, TableRow, TableCell, Paper, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';
import { API_BASE_URL } from '../config.js';
import { DocLink } from '../newMain';

const AlleleInfo = ({ alleles }) => {
  if (!alleles || alleles.length === 0) {
    return <span>No Alleles</span>;
  }

  return alleles.map((allele, index) => (
    <span
      key={index}
      style={{ 
        display: 'inline-block', 
        margin: '2px', 
        padding: '2px 5px', 
        border: '1px solid #ccc', 
        borderRadius: '3px',
        backgroundColor: '#f0f0f0'
      }}
    >
      {allele}
    </span>
  ));
};


function EpletTab({epletData, donors, recipients, classesToShow, tabState, setTabState, entityInfo}) {
  const [selectedRecipient, setSelectedRecipient] = useState(tabState?.selectedRecipient || Object.keys(recipients)[0] || '');
  const [selectedDonor, setSelectedDonor] = useState(tabState?.selectedDonor || Object.keys(donors)[0] || '');
  const [selectedClass, setSelectedClass] = useState(tabState?.selectedClass || classesToShow[0] || '');
  const [differenceType, setDifferenceType] = useState(tabState?.differenceType || 'donor');
  const [selectedEplet, setSelectedEplet] = useState(tabState?.selectedEplet || '');
  const [selectedAllele, setSelectedAllele] = useState('');
  const [alleleEplets, setAlleleEplets] = useState([]);

  const handleRecipientChange = (event) => {
    const value = event.target.value;
    setSelectedRecipient(value);
    setTabState(prevState => ({...prevState, selectedRecipient: value}));
    setSelectedEplet('');
  };

  const handleDonorChange = (event) => {
    const value = event.target.value;
    setSelectedDonor(value);
    setTabState(prevState => ({...prevState, selectedDonor: value, selectedClass: ''}));
    setSelectedEplet('');
  };

  const handleClassChange = (event) => {
    const value = event.target.value;
    setSelectedClass(value);
    setTabState(prevState => ({...prevState, selectedClass: value}));
    setSelectedEplet('');
  };

  const handleDifferenceTypeChange = (event) => {
    const value = event.target.value;
    setDifferenceType(value);
    setTabState(prevState => ({...prevState, differenceType: value}));
    setSelectedEplet('');
  };

  const handleEpletChange = (event) => {
    setSelectedEplet(event.target.value);
    setTabState(prevState => ({...prevState, selectedEplet: event.target.value}));
  };

  const getEpletData = () => {
    if (selectedRecipient && selectedDonor && selectedClass) {
      return epletData?.[selectedRecipient]?.[selectedDonor]?.[selectedClass]?.[differenceType === 'donor' ? 'donor_diff' : 'recip_diff'];
    }
    return null;
  };

  const eplets = getEpletData();

  const availableEplets = useMemo(() => {
    return eplets ? Object.keys(eplets) : [];
  }, [eplets]);

  const filteredClassesToShow = classesToShow.filter(cls => cls !== 'IIDRA');

  const columnTitles = differenceType === 'donor'
    ? ['Eplet ID', 'Donor alleles responsible for mismatch']
    : ['Eplet ID', 'Recipient alleles responsible for mismatch'];

  const sequences = useMemo(() => {
    if (!selectedEplet || !eplets || !eplets[selectedEplet]) return {};
    
    const getSequence = (id) => {
      return entityInfo[id].aligned_seq;
    };
    
    const epletInfo = eplets[selectedEplet];
    const seqs = {};
    epletInfo.donors.forEach(id => {
      const seq = getSequence(id);
      if (seq) seqs[id] = seq.slice(epletInfo.min_pos - 1, epletInfo.max_pos);
    });
    epletInfo.recipients.forEach(id => {
      const seq = getSequence(id);
      if (seq) seqs[id] = seq.slice(epletInfo.min_pos - 1, epletInfo.max_pos);
    });
    return seqs;
  }, [selectedEplet, eplets, entityInfo]);

  const getCellStyle = (index, epletInfo, isHeader, cellValue) => {
    const position = epletInfo.min_pos + index;
    if (isHeader && position === parseInt(epletInfo.mismatch_position)) {
      return { backgroundColor: 'rgba(255, 0, 0, 0.3)' }; // Red for mismatch position in header
    }
    if (!isHeader && 
        epletInfo.eplet_data && 
        epletInfo.eplet_data[position] === cellValue) {
      return { backgroundColor: 'rgba(0, 0, 255, 0.3)' }; // Blue for matching eplet positions
    }
    return {};
  };

  const Legend = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: 20, height: 20, backgroundColor: 'rgba(255, 0, 0, 0.3)', mr: 1 }} />
        <Typography variant="body2">Mismatch Position</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: 20, height: 20, backgroundColor: 'rgba(0, 0, 255, 0.3)', mr: 1 }} />
        <Typography variant="body2">Eplet positions</Typography>
      </Box>
    </Box>
  );

  const allAlleles = useMemo(() => {
    const alleleSet = new Set();
    Object.values(donors).forEach(donor => donor.Haplotype.forEach(allele => alleleSet.add(allele)));
    Object.values(recipients).forEach(recipient => recipient.Haplotype.forEach(allele => alleleSet.add(allele)));
    return Array.from(alleleSet).sort();
  }, [donors, recipients]);

  const handleAlleleChange = (event) => {
    setSelectedAllele(event.target.value);
  };

  useEffect(() => {
    if (selectedAllele) {
      fetch(`${API_BASE_URL}/api/eplets/${selectedAllele}`)
        .then(response => response.json())
        .then(data => {
          console.log('Fetched eplets for allele:', selectedAllele, data);
          
          if (data === null) {
            setAlleleEplets([]);
            return;
          }
          
          // Sort the eplets by their leading number
          const sortedEplets = data.sort((a, b) => {
            const numA = parseInt(a.match(/^\d+/)[0]);
            const numB = parseInt(b.match(/^\d+/)[0]);
            return numA - numB;
          });
          setAlleleEplets(sortedEplets);
        })
        .catch(error => console.error('Error fetching allele eplets:', error));
    } else {
      setAlleleEplets([]);
    }
  }, [selectedAllele]);

  return(
    <div>
      <h3>Known eplets in mismatches<DocLink href={`${API_BASE_URL}/docs/overview.html#known-eplets`} /></h3>
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
              disabled={!selectedDonor}
            >
              {filteredClassesToShow.map((cls) => (
                <MenuItem key={cls} value={cls}>{`Class ${cls}`}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Mismatch Type</InputLabel>
            <Select 
              value={differenceType} 
              onChange={handleDifferenceTypeChange} 
              label="Difference Type"
            >
              <MenuItem value="donor">Donor Differences</MenuItem>
              <MenuItem value="recipient">Recipient Differences</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>

      {eplets && (
        <>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} size="small" aria-label="eplet table">
              <TableHead>
                <TableRow>
                  {columnTitles.map((title, index) => (
                    <TableCell key={index}>
                      {title}
                      {index === 1 && (
                        <Tooltip title="The alleles that have this mismatch and the eplet.">
                          <InfoIcon fontSize="small" style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
                        </Tooltip>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(eplets).map(([epletId, data]) => (
                  <TableRow key={epletId}>
                    <TableCell>{epletId}</TableCell>
                    {differenceType === 'donor' ? (
                      <>
                        <TableCell><AlleleInfo alleles={data.donors} /></TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell><AlleleInfo alleles={data.recipients} /></TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <div style={{ marginTop: '20px', marginBottom: '20px' }}>
            <FormControl fullWidth>
              <InputLabel id="eplet-select-label">Select Eplet</InputLabel>
              <Select
                labelId="eplet-select-label"
                id="eplet-select"
                value={selectedEplet}
                label="Select Eplet"
                onChange={handleEpletChange}
              >
                {availableEplets.map((eplet) => (
                  <MenuItem key={eplet} value={eplet}>{eplet}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {selectedEplet && eplets[selectedEplet] && (
            <div>
              <h4>Eplet in sequence</h4>
              <Legend />
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Entity</TableCell>
                      {[...Array(eplets[selectedEplet].max_pos - eplets[selectedEplet].min_pos + 1)].map((_, index) => (
                        <TableCell 
                          key={index} 
                          align="center"
                          style={getCellStyle(index, eplets[selectedEplet], true, null)}
                        >
                          {eplets[selectedEplet].min_pos + index}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(sequences)
                      .filter(([id, _]) => 
                        differenceType === 'donor' 
                          ? eplets[selectedEplet].donors.includes(id)
                          : eplets[selectedEplet].recipients.includes(id)
                      )
                      .map(([id, sequence]) => (
                        <TableRow key={id}>
                          <TableCell component="th" scope="row">{id}</TableCell>
                          {[...sequence].map((char, index) => (
                            <TableCell 
                              key={index} 
                              align="center"
                              style={getCellStyle(index, eplets[selectedEplet], false, char)}
                            >
                              {char}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          )}
        </>
      )}

      <div className="section-separator"></div>

      <div style={{ marginTop: '40px' }}>
        <h3>Eplets in individual alleles</h3>
        <p>Displays the known eplets present in the selected allele.</p>
        <FormControl sx={{ minWidth: 200, marginBottom: '20px' }}>
          <InputLabel>Select Allele</InputLabel>
          <Select
            value={selectedAllele}
            onChange={handleAlleleChange}
            label="Select Allele"
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 48 * 4.5 + 8,
                },
              },
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'left',
              },
              getContentAnchorEl: null,
            }}
          >
            {allAlleles.map((allele) => (
              <MenuItem key={allele} value={allele}>{allele}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedAllele && (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Eplet</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alleleEplets.length > 0 ? (
                  alleleEplets.map((eplet, index) => (
                    <TableRow key={index}>
                      <TableCell>{eplet}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell>No eplets found for this allele</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

    </div>
  )
}

export default EpletTab;