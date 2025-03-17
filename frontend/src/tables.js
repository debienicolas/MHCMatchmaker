import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, Accordion, AccordionSummary, AccordionDetails, Typography} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


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



const DonorTable = ({ donors, classesToShow }) => {
  if (!donors || typeof donors !== 'object' || Object.keys(donors).length === 0) {
    return <p>No donor data available</p>;
  }

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="donor table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '150px' }}>Donor ID</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(donors).map(([donorId, donorData]) => (
            <TableRow key={donorId}>
              <TableCell sx={{ width: '150px' }}>{donorId}</TableCell>
              <TableCell>
                <TableContainer>
                  <Table size="small" aria-label="haplotypes">
                    <TableHead>
                      <TableRow>
                        <TableCell>Class</TableCell>
                        <TableCell>Haplotype</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(donorData.classified)
                        .filter(([classType]) => classesToShow.includes(classType))
                        .map(([classType, haplotype]) => (
                          <TableRow key={classType}>
                            <TableCell>{classType}</TableCell>
                            <TableCell><AlleleInfo alleles={haplotype} /></TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DonorTable;

export function RecipientTable({ recipients, classesToShow }) {
  if (!recipients || typeof recipients !== 'object' || Object.keys(recipients).length === 0) {
    return <p>No recipient data available</p>;
  }

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="recipient table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '150px' }}>Recipient ID</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(recipients).map(([recipientId, recipientData]) => (
            <TableRow key={recipientId}>
              <TableCell sx={{ width: '150px' }}>{recipientId}</TableCell>
              <TableCell>
                <TableContainer>
                  <Table size="small" aria-label="haplotypes">
                    <TableHead>
                      <TableRow>
                        <TableCell>Class</TableCell>
                        <TableCell align="left">Haplotype</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(recipientData.classified).filter(([classType]) => classesToShow.includes(classType)).map(([classType, haplotype]) => (
                        <TableRow key={classType}>
                          <TableCell>{classType}</TableCell>
                          <TableCell><AlleleInfo alleles={haplotype} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}


export function DatabaseTable({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <p>No data available</p>;
  }

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="allele data table">
        <TableBody>
          {Object.entries(data).map(([key, value]) => (
            <TableRow key={key} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component="th" scope="row">
                {key}
              </TableCell>
              <TableCell>
                {key === 'sequence' ? (
                  <div style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
                    {value}
                  </div>
                ) : (
                  typeof value === 'object' ? JSON.stringify(value) : value.toString()
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const ClassMismatchTable = ({ classData }) => {
  // Sort donors by mismatch count in ascending order
  const sortedDonors = Object.entries(classData).sort((a, b) => 
    a[1].updated_mismatches_count - b[1].updated_mismatches_count
  );

  const MismatchCell = ({ mismatches }) => {
    const mismatchEntries = mismatches
      .map((mismatch, index) => mismatch && mismatch.length > 0 ? `${index + 1}:${mismatch.join('/')}` : null)
      .filter(Boolean);

    const displayMismatches = mismatchEntries.slice(0, 5).join(', ');
    const remainingCount = Math.max(0, mismatchEntries.length - 5);

    return (
      <Tooltip title={mismatchEntries.join(', ')} arrow>
        <span>
          {displayMismatches}
          {remainingCount > 0 && `, +${remainingCount} more`}
        </span>
      </Tooltip>
    );
  };

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} size="small" aria-label="mismatch table">
        <TableHead>
          <TableRow>
            <TableCell>Rank</TableCell>
            <TableCell>Donor ID</TableCell>
            <TableCell>Mismatches</TableCell>
            <TableCell align="right">Mismatch Count</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedDonors.map(([donorId, donorData], index) => (
            <TableRow key={donorId}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{donorId}</TableCell>
              <TableCell>
                <MismatchCell mismatches={donorData.updated_mismatches} />
              </TableCell>
              <TableCell align="right">{donorData.updated_mismatches_count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export function MismatchTable({ data, classesToShow }) {
  if (!data || Object.keys(data).length === 0) {
    return <p>No mismatch data available</p>;
  }

  // Filter classes based on the relevant_classes prop and available data
  console.log(classesToShow);

  return (
    <div>
      {classesToShow.map((className) => {
        const classData = Object.entries(data).reduce((acc, [donorId, donorData]) => {
          if (donorData[className] && Object.keys(donorData[className]).length > 0) {
            acc[donorId] = donorData[className];
          }
          return acc;
        }, {});

        return (
          <Accordion key={className}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{`Class ${className} Mismatches`}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {Object.keys(classData).length > 0 ? (
                <ClassMismatchTable classData={classData} />
              ) : (
                <p>No data available for Class {className}</p>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
}



