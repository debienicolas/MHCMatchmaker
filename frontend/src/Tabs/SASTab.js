import React, { useState, useEffect,useMemo } from 'react';
import Select from 'react-select';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Checkbox, FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

import { DocLink } from '../newMain.js';
import { API_BASE_URL } from '../config.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, annotationPlugin);

function SolventAccessibilityScores({ entityInfo, rsaThreshold, tabState, setTabState }) {
  const [selectedAlleles, setSelectedAlleles] = useState(tabState?.selectedAlleles || []);
  const [chartData, setChartData] = useState(null);
  const [differencePositions, setDifferencePositions] = useState([]);
  const [showDifferences, setShowDifferences] = useState(tabState?.showDifferences || true);

  const alleleOptions = Object.keys(entityInfo).map(allele => ({
    value: allele,
    label: allele
  }));

  useEffect(() => {
    if (selectedAlleles.length > 0) {
      const datasets = selectedAlleles.map((allele, index) => {
        const alleleData = entityInfo[allele.value];
        return {
          label: allele.value, 
          data: Object.values(alleleData.rsa_scores),
          borderColor: getColor(index),
          backgroundColor: getColor(index, 0.2),
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
        };
      });

      
      const labels = Object.keys(entityInfo[selectedAlleles[0].value].rsa_scores)
      .map(key => parseInt(key));  // Add +1 here to shift the labels  
      console.log("Labels ",labels)
      console.log("Datasets ",datasets)
      setChartData({ labels, datasets });
      
      // Calculate difference positions
      const sequences = selectedAlleles.map(allele => entityInfo[allele.value].aligned_seq);
      const newDifferencePositions = [];
      for (let i = 0; i < sequences[0].length; i++) {
        if (new Set(sequences.map(seq => seq[i])).size > 1) {
          newDifferencePositions.push(i);  // Add +1 here to shift the difference positions
        }
      }
      setDifferencePositions(newDifferencePositions);
      setTabState(prevState => ({...prevState, selectedAlleles: selectedAlleles, showDifferences: showDifferences}))
    } else {
      setChartData(null);
      setDifferencePositions([]);
      setTabState(prevState => ({...prevState, selectedAlleles: selectedAlleles, showDifferences: showDifferences}));
    }
  },[selectedAlleles, entityInfo, setTabState, showDifferences]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        title: {
          display: true,
          text: 'Relative Solvent Accessibility',
          font: { size: 14 }
        } 
      },
      x: {
        title: {
          display: true,
          text: 'Amino Acid Position',
          font: { size: 14 },
          align: 'start'
        },
        min: 1, 
        ticks: {
          callback: function(value,index) {
            return index+1;  // Remove the condition that was hiding the '0' tick
          },
          autoSkip: false,
          maxRotation: 90,
          minRotation: 90
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          padding: 20,
          generateLabels: (chart) => {
            const defaultLabels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
            
            if (selectedAlleles.length > 1 && showDifferences) {
              defaultLabels.push({
                text: 'Amino Acid Mismatches',
                strokeStyle: 'rgba(255, 0, 0, 0.5)',
                fillStyle: 'rgba(255, 0, 0, 0.5)',
                lineWidth: 1,
                hidden: false,
                index: defaultLabels.length,
              });
            }
            
            return defaultLabels;
          }
        }
      },
      annotation: {
        common: {
          drawTime: 'afterDatasetsDraw',
        },
        annotations: {
          rsaThresholdBox: {
            type: 'box',
            yMin: 0,
            yMax: rsaThreshold,
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            borderWidth: 0,
          },
          rsaThresholdLine: {
            type: 'line',
            yMin: rsaThreshold,
            yMax: rsaThreshold,
            borderColor: 'rgba(255, 0, 0, 0.8)',
            borderWidth: 2,
            label: {
              content: `RSA Threshold: ${rsaThreshold}`,
              enabled: true,
              position: 'start',
              backgroundColor: 'rgba(255, 0, 0, 0.8)',
              color: 'white',
            }
          },
          ...showDifferences && selectedAlleles.length > 1 ? differencePositions.reduce((acc, pos, index) => {
            acc[`mismatchLine${index}`] = {
              type: 'line',
              scaleID: 'x',
              value: pos,
              borderColor: 'rgba(255, 0, 0, 0.5)',
              borderWidth: 1,
            };
            return acc;
          }, {}) : {},
        },
      },
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'xy'
        },
        pan: { enabled: true, mode: 'xy' }
      },
    },
    animation: {
      duration: 0
    },
    transitions: {
      active: {
        animation: {
          duration: 0
        }
      }
    },
    hover: {
      animationDuration: 0
    },
    responsiveAnimationDuration: 0
  }), [rsaThreshold, showDifferences, differencePositions, selectedAlleles]);

  const customStyles = {
    control: (provided) => ({
      ...provided,
      borderRadius: '8px',
      border: '1px solid #ccc',
      boxShadow: 'none',
      '&:hover': {
        border: '1px solid #aaa',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#007bff' : state.isFocused ? '#e0e0e0' : null,
      color: state.isSelected ? 'white' : 'black',
    }),
  };

  const getColor = (index, alpha = 1) => {
    const colors = [
      `rgba(75, 192, 192, ${alpha})`,  // Teal
      `rgba(54, 162, 235, ${alpha})`,  // Blue
      `rgba(153, 102, 255, ${alpha})`, // Purple
      `rgba(255, 159, 64, ${alpha})`,  // Orange
      `rgba(255, 206, 86, ${alpha})`,  // Yellow
      `rgba(199, 199, 199, ${alpha})`,  // Gray
      `rgba(0, 255, 0, ${alpha})`,  // Green
      `rgba(255, 192, 203, ${alpha})`,  // Pink
      `rgba(0, 0, 255, ${alpha})`,  // Blue
      `rgba(135, 206, 235, ${alpha})`,  // Light Blue
      `rgba(128, 0, 128, ${alpha})`,  // Purple
      `rgba(255, 165, 0, ${alpha})`,  // Orange
      `rgba(135, 206, 235, ${alpha})`,  // Light Blue
      `rgba(128, 0, 128, ${alpha})`,  // Purple
      `rgba(255, 165, 0, ${alpha})`,  // Orange
      `rgba(135, 206, 235, ${alpha})`,  // Light Blue
      `rgba(128, 0, 128, ${alpha})`,  // Purple
    ];
    return colors[index % colors.length];
  };

  const handleShowDifferencesChange = (event) => {
    setShowDifferences(event.target.checked);
    setTabState(prevState => ({...prevState, showDifferences: event.target.checked}))
  };

  return (
      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}> 
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', position: 'relative', zIndex: 12 }}>
          <div style={{ width: '300px', marginRight: '20px' }}>
            <Select
              options={alleleOptions}
              value={selectedAlleles}
              onChange={setSelectedAlleles}
              placeholder="Select alleles"
              styles={customStyles}
              isMulti
            />
          </div>
          {selectedAlleles.length > 1 && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={showDifferences}
                  onChange={handleShowDifferencesChange}
                />
              }
              label="Show mismatches"
            />
          )}
        </div>
        {selectedAlleles.length > 0 && (
          <div>
            <h4>Selected Alleles:</h4>
            <SelectedAllelesSequenceTable 
              selectedAlleles={selectedAlleles} 
              entityInfo={entityInfo} 
              showDifferences={showDifferences}
            />
            <div style={{
              width: '100%',
              height: '500px',
              overflowX: 'auto',
              overflowY: 'hidden',
            }}>
              <div style={{
                width: `${Math.max(1000, chartData?.labels?.length * 15)}px`,
                height: '100%',
              }}>
                {chartData && <Line data={chartData} options={options} />}
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

function GroupedSolventAccessibilityScores({ sasScores, rsaThreshold, tabState, setTabState }) {
  const [selectedClass, setSelectedClass] = useState(tabState.selectedClass || null);
  const [selectedEntities, setSelectedEntities] = useState(tabState.selectedEntities || []);
  const [chartData, setChartData] = useState(null);

  const classOptions = useMemo(() => {
    const classes = new Set();
    Object.values(sasScores).forEach(entityData => {
      Object.keys(entityData).forEach(className => {
        if (Object.keys(entityData[className]).length > 0) {
          classes.add(className);
        }
      });
    });
    return Array.from(classes).map(className => ({
      value: className,
      label: className
    }));
  }, [sasScores]);

  const entityOptions = Object.keys(sasScores).map(entity => ({
    value: entity,
    label: entity
  }));

  useEffect(() => {
    if (selectedClass && selectedEntities.length > 0) {
      const datasets = selectedEntities.map((entity, index) => {
        const entityData = sasScores[entity.value][selectedClass.value];
        return {
          label: entity.value,
          data: Object.values(entityData).map((values) => values.rsa),
          borderColor: getColor(index),
          backgroundColor: getColor(index, 0.2),
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
        };
      });

      // const allPositions = datasets.flatMap(dataset => dataset.data.map(point => point.x));
      const labels = Object.keys(sasScores[selectedEntities[0].value][selectedClass.value]).map(key => parseInt(key)+1);
      
      console.log("Labels ",labels)
      console.log("Datasets ",datasets)

      setChartData({ labels, datasets });

      // Update difference positions calculation
      const newDifferencePositions = [];
      for (let i = 0; i < labels.length; i++) {
        const position = labels[i] - 1;  // Adjust position when checking differences
        const rsaValues = selectedEntities.map(entity => {
          const entityData = sasScores[entity.value][selectedClass.value];
          return entityData[position]?.rsa;
        });
        if (new Set(rsaValues.filter(v => v !== undefined)).size > 1) {
          newDifferencePositions.push(labels[i]);  // Use shifted position for differences
        }
      }
      
      setTabState(prevState => ({...prevState, selectedClass: selectedClass, selectedEntities: selectedEntities}))
    } else {
      setChartData(null);
      
      setTabState(prevState => ({...prevState, selectedClass: selectedClass, selectedEntities: selectedEntities}))
    }
  }, [selectedClass, selectedEntities, sasScores, setTabState]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        title: {
          display: true,
          text: 'Relative Solvent Accessibility',
          font: { size: 14 }
        },
      },
      x: {
        title: {
          display: true,
          text: 'Amino Acid Position',
          font: { size: 14 },
          align: 'start'
        },
        min: 1,  // This now correctly represents the start of your data
        ticks: {
          callback: function(value,index) {
            return index+1;
          },
          autoSkip: false,
          maxRotation: 90,
          minRotation: 90
        }
      }
    },
    plugins: {
      legend: { position: 'top', align: 'start', margin: { bottom: 100 } },
      annotation: {
        annotations: [
          {
            type: 'box',
            yMin: 0,
            yMax: rsaThreshold,
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            borderWidth: 0,
          },
          {
            type: 'line',
            scaleID: 'y',
            value: rsaThreshold,
            borderColor: 'rgba(255, 0, 0, 0.8)',
            borderWidth: 2,
            label: {
              content: `RSA Threshold: ${rsaThreshold}`,
              enabled: true,
              position: 'start',
              backgroundColor: 'rgba(255, 0, 0, 0.8)',
              color: 'white',
            }
          }
        ]
      },
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'xy'
        },
        pan: { enabled: true, mode: 'xy' }
      },
    },
  }), [rsaThreshold]);

  const customStyles = {
    control: (provided) => ({
      ...provided,
      borderRadius: '8px',
      border: '1px solid #ccc',
      boxShadow: 'none',
      '&:hover': {
        border: '1px solid #aaa',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#007bff' : state.isFocused ? '#e0e0e0' : null,
      color: state.isSelected ? 'white' : 'black',
    }),
  };

  const getColor = (index, alpha = 1) => {
    const colors = [
      `rgba(75, 192, 192, ${alpha})`,  // Teal
      `rgba(54, 162, 235, ${alpha})`,  // Blue
      `rgba(153, 102, 255, ${alpha})`, // Purple
      `rgba(255, 159, 64, ${alpha})`,  // Orange
      `rgba(255, 206, 86, ${alpha})`,  // Yellow
    ];
    return colors[index % colors.length];
  };

  const handleClassChange = (selectedOption) => {
    setSelectedClass(selectedOption);
    setSelectedEntities([]);
    setTabState(prevState => ({...prevState, selectedClass: selectedOption, selectedEntities: []}))
  };

  
  const getEntitySelectWidth = useMemo(() => {
    if (!selectedEntities.length) return 300;
    const baseWidth = 300;
    const additionalWidth = selectedEntities.length * 50; // Adjust this multiplier as needed
    return Math.min(baseWidth + additionalWidth, 600); // Set a maximum width if desired
  }, [selectedEntities]);

  

  return (
      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}> 
        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '20px', alignItems: 'center' }}>
          <div style={{ width: '300px', marginRight: '20px', position: 'relative', zIndex: 10 }}>
            <Select
              options={classOptions}
              value={selectedClass}
              onChange={handleClassChange}
              placeholder="Select class"
              styles={customStyles}
            />
          </div>
          <div style={{ width: `${getEntitySelectWidth}px`, position: 'relative', zIndex: 10 }}>
            <Select
              options={entityOptions}
              value={selectedEntities}
              onChange={setSelectedEntities}
              placeholder="Select donor/recipient"
              styles={customStyles}
              isMulti
              isDisabled={!selectedClass}
            />
          </div>
          
        </div>
        {selectedEntities.length > 0 && (
          <div>
            <div style={{
              width: '100%',
              height: '500px',
              overflowX: 'auto',
              overflowY: 'hidden',
            }}>
              <div style={{
                width: `${Math.max(1000, chartData?.labels?.length * 15)}px`,
                height: '100%',
              }}>
                {chartData && <Line data={chartData} options={options} />}
              </div>
            </div>
          </div>
        )}
      </div>
  );
}


function SelectedAllelesSequenceTable({ selectedAlleles, entityInfo, showDifferences }) {
  if (!selectedAlleles || selectedAlleles.length === 0) {
    return null;
  }

  const sequences = selectedAlleles.reduce((acc, allele) => {
    const alignedSeq = entityInfo[allele.value]?.aligned_seq;
    if (alignedSeq) {
      acc[allele.value] = alignedSeq;
    }
    return acc;
  }, {});

  const sequenceNames = Object.keys(sequences);
  
  if (sequenceNames.length === 0) {
    return <p>No aligned sequence data available for selected alleles.</p>;
  }

  const longestSequence = Math.max(...Object.values(sequences).map(seq => seq.length));

  return (
    <TableContainer component={Paper} sx={{ overflowX: 'auto', maxHeight: 300, marginBottom: '20px' }}>
      <Table stickyHeader sx={{ minWidth: 650 }} aria-label="selected alleles aligned sequence table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ minWidth: 150, position: 'sticky', left: 0, zIndex: 3, backgroundColor: 'background.paper' }}>Allele</TableCell>
            {[...Array(longestSequence)].map((_, index) => (
              <TableCell key={index} align="center" sx={{ minWidth: 30 }}>{index + 1}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {selectedAlleles.map((allele, index) => (
            <TableRow key={allele.value} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell 
                component="th" 
                scope="row" 
                sx={{ 
                  position: 'sticky', 
                  left: 0, 
                  backgroundColor: 'background.paper', 
                  zIndex: 1,
                  fontWeight: 'bold',
                  minWidth: 150,
                }}
              >
                {allele.value}
              </TableCell>
              {entityInfo[allele.value].aligned_seq.split('').map((aa, pos) => {
                const isDifferent = showDifferences && selectedAlleles.length > 1 &&
                  selectedAlleles.some(other => entityInfo[other.value].aligned_seq[pos] !== aa);
                return (
                  <TableCell 
                    key={pos} 
                    align="center" 
                    sx={{ 
                      padding: 1, 
                      minWidth: 30,
                      backgroundColor: isDifferent ? 'rgba(255, 0, 0, 0.2)' : 'inherit'
                    }}
                  >
                    {aa}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}


export function SASTab({entityInfo, rsa, SAScoresTabData, setSAScoresTabData, responseData}){
  return(
    <div>
      <h3>Allele solvent accessibility scores <DocLink href={`${API_BASE_URL}/docs/overview.html#solvent-accessibility-scores`} /></h3>
      <SolventAccessibilityScores entityInfo={entityInfo} rsaThreshold={rsa} tabState={SAScoresTabData} setTabState={setSAScoresTabData}/>
      <div className="section-separator"></div>
      <h3>Donor/Recipient Grouped solvent accessibility scores <DocLink href={`${API_BASE_URL}/docs/overview.html#solvent-accessibility-scores`} /></h3>
      <GroupedSolventAccessibilityScores sasScores={responseData.grouped_sas_scores} rsaThreshold={rsa} tabState={SAScoresTabData} setTabState={setSAScoresTabData}/>
    </div>
  )
}

export default SASTab;