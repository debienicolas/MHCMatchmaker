import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel } from '@mui/material';

import { API_BASE_URL } from '../config';
import { DocLink } from '../newMain';


// Helper function to get Donors/Recipients for a given class
const getAllelesForClass = (data, className) => {
    return Object.values(data).flatMap(entity => 
      entity.classified[className] || []
    );
};


export function AlignedSequenceTable({ sequences, donors, recipients, tabState, setTabState }) {

    // Initialize state variables
    const [selectedClass, setSelectedClass] = useState(tabState.selectedClass || 'I');
    const [selectedAnimals, setSelectedAnimals] = useState(tabState.selectedAnimals || ['all']);
    const [consensusSequence, setConsensusSequence] = useState(tabState.consensusSequence || '');
    const [showMismatches, setShowMismatches] = useState(tabState.showMismatches || false);
    const [showSequenceMismatches, setShowSequenceMismatches] = useState(tabState.showSequenceMismatches || false);
  
    const fetchConsensusSequence = async (className) => {
      try {
        console.log('fetching consensus sequence for class: ',className)
        const response = await axios.get(`${API_BASE_URL}/api/consensus_seq/${className}`);
        setConsensusSequence(response.data);
      } catch (error) {
        console.error('Error fetching consensus sequence:', error);
        setConsensusSequence('');
      }
    };
  
    useEffect(() => {
      fetchConsensusSequence(selectedClass);
      setTabState(prevState => ({...prevState, selectedClass: selectedClass}))
    }, [selectedClass, selectedAnimals, consensusSequence,showMismatches, setTabState]);
  
    const classOptions = useMemo(() => {
      const classes = new Set();
      [...Object.values(donors), ...Object.values(recipients)].forEach(entity => {
        Object.keys(entity.classified).forEach(cls => {
          if (entity.classified[cls].length > 0) {
            classes.add(cls);
          }
        });
      });
      return Array.from(classes);
    }, [donors, recipients]);
  
    const animalOptions = useMemo(() => {
      const options = [{ id: 'all', label: 'All' }];
      [...Object.keys(donors), ...Object.keys(recipients)].forEach(id => {
        options.push({ id, label: `${id} (${id in donors ? 'Donor' : 'Recipient'})` });
      });
      return options;
    }, [donors, recipients]);
  
    useEffect(() => {
      if (classOptions.length > 0 && !classOptions.includes(selectedClass)) {
        setSelectedClass(classOptions[0]);
        setTabState(prevState => ({...prevState, selectedClass: classOptions[0]}))
      }
    }, [classOptions, selectedClass, setTabState]);
  
    const filteredSequences = useMemo(() => {
      let alleles;
      if (selectedAnimals.includes('all')) {
        alleles = [
          ...getAllelesForClass(donors, selectedClass),
          ...getAllelesForClass(recipients, selectedClass)
        ];
      } else {
        alleles = selectedAnimals.flatMap(animalId => {
          const animalData = donors[animalId] || recipients[animalId];
          return animalData ? animalData.classified[selectedClass] || [] : [];
        });
      }
      return Object.fromEntries(
        Object.entries(sequences).filter(([name]) => alleles.includes(name))
      );
    }, [sequences, donors, recipients, selectedClass, selectedAnimals]);
  
    const sequenceNames = Object.keys(filteredSequences);
    const longestSequence = sequenceNames.length > 0 
      ? Math.max(...Object.values(filteredSequences).map(seq => seq.length))
      : 0;
  
    const handleShowMismatchesChange = (event) => {
      const newValue = event.target.checked;
      setShowMismatches(newValue);
      if (newValue) {
        setShowSequenceMismatches(false);
      }
      setTabState(prevState => ({
        ...prevState,
        showMismatches: newValue,
        showSequenceMismatches: false
      }));
    };

    const handleShowSequenceMismatchesChange = (event) => {
      const newValue = event.target.checked;
      setShowSequenceMismatches(newValue);
      if (newValue) {
        setShowMismatches(false);
      }
      setTabState(prevState => ({
        ...prevState,
        showMismatches: false,
        showSequenceMismatches: newValue
      }));
    };

    const getMismatchStyle = (char, consensusChar) => {
      return char !== consensusChar
        ? { backgroundColor: 'rgba(255, 0, 0, 0.2)' }
        : {};
    };

    const getSequenceMismatchStyle = (chars) => {
      return chars.some(char => char !== chars[0])
        ? { backgroundColor: 'rgba(255, 0, 0, 0.2)' }
        : {};
    };

    const handleAnimalChange = (event) => {
      const selectedValue = event.target.value;
      let newSelection;
  
      if (selectedValue.includes('all')) {
        // If 'all' is being toggled
        if (selectedAnimals.includes('all')) {
          // If 'all' was already selected, remove it
          newSelection = selectedValue.filter(item => item !== 'all');
        } else {
          // If 'all' is being selected, only select 'all'
          newSelection = ['all'];
        }
      } else {
        // If other animals are being selected
        newSelection = selectedValue.filter(item => item !== 'all');
      }
  
      setSelectedAnimals(newSelection);
      setTabState({selectedClass: selectedClass, selectedAnimals: newSelection, consensusSequence: consensusSequence, showMismatches: showMismatches, showSequenceMismatches: showSequenceMismatches})
    };
  
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="animal-select-label">Donors/Recipients</InputLabel>
            <Select
              labelId="animal-select-label"
              id="animal-select"
              multiple
              value={selectedAnimals}
              label="Donors/Recipients"
              onChange={handleAnimalChange}
              renderValue={(selected) => selected.join(', ')}
            >
              {animalOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  <Checkbox checked={selectedAnimals.indexOf(option.id) > -1} />
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="class-select-label">MHC Class</InputLabel>
            <Select
              labelId="class-select-label"
              id="class-select"
              value={selectedClass}
              label="MHC Class"
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {classOptions.map((cls) => (
                <MenuItem key={cls} value={cls}>{`Class ${cls}`}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showMismatches}
                  onChange={handleShowMismatchesChange}
                  color="primary"
                />
              }
              label="Show mismatches w.r.t. consensus"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showSequenceMismatches}
                  onChange={handleShowSequenceMismatchesChange}
                  color="primary"
                />
              }
              label="Show mismatches between alleles"
            />
          </div>
        </div>
  
        {sequenceNames.length > 0 ? (
          <TableContainer component={Paper} sx={{ maxHeight: 1000, overflow: 'auto' }}>
            <Table stickyHeader sx={{ minWidth: 650 }} aria-label="aligned sequence table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 150, position: 'sticky', left: 0, zIndex: 3, background: '#fff' }}>
                    Allele Name
                  </TableCell>
                  {[...Array(longestSequence)].map((_, index) => (
                    <TableCell key={index} align="center" sx={{ minWidth: 30, zIndex: 2 }}>{index + 1}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      position: 'sticky', 
                      left: 0, 
                      zIndex: 3, 
                      background: '#fff', 
                      fontWeight: 'bold',
                      top: 56,
                    }}
                  >
                    Consensus Sequence
                  </TableCell>
                  {[...consensusSequence].map((char, index) => (
                    <TableCell 
                      key={index} 
                      align="center" 
                      sx={{ 
                        padding: 1, 
                        minWidth: 30, 
                        fontWeight: 'bold',
                        position: 'sticky',
                        top: 56,
                        zIndex: 2,
                        background: '#f0f0f0'
                      }}
                    >
                      {char}
                    </TableCell>
                  ))}
                </TableRow>
                {sequenceNames.map(name => (
                  <TableRow key={name}>
                    <TableCell sx={{ position: 'sticky', left: 0, background: '#fff', zIndex: 1, fontWeight: 'bold' }}>{name}</TableCell>
                    {[...filteredSequences[name]].map((char, index) => (
                      <TableCell 
                        key={index} 
                        align="center" 
                        sx={{ 
                          padding: 1, 
                          minWidth: 30,
                          ...(showMismatches ? getMismatchStyle(char, consensusSequence[index]) : {}),
                          ...(showSequenceMismatches ? getSequenceMismatchStyle(sequenceNames.map(name => filteredSequences[name][index])) : {})
                        }}
                      >
                        {char}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <p>No sequences to display for the selected class.</p>
        )}
      </>
    );
  }




function AlignmentTab({sequences, donors, recipients, tabState, setTabState}) {
    return (
        <div>
            <h3>Aligned alleles<DocLink href={`${API_BASE_URL}/docs/overview.html#alignment`}/></h3>
            <AlignedSequenceTable sequences={sequences} donors={donors} recipients={recipients} tabState={tabState} setTabState={setTabState}/>
        </div>
    )
}

export default AlignmentTab;



