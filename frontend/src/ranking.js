import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography, 
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

const ScoreBar = ({ score }) => {
  const percentage = score || 0;
  const barColor = `hsl(${percentage}, 100%, 50%)`;
  const textColor = percentage > 50 ? '#000000' : '#ffffff';

  return (
    <Box sx={{ width: '100%', bgcolor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
      <Box
        sx={{
          width: `${percentage}%`,
          bgcolor: barColor,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'width 0.5s ease-in-out',
        }}
      >
        <Typography variant="body2" sx={{ color: textColor, fontWeight: 'bold' }}>
          {score ? score.toFixed(2) : 'N/A'}
        </Typography>
      </Box>
    </Box>
  );
};

const ClassRanking = ({ classData, className }) => {
  const sortedData = [...classData].sort((a, b) => (b.updated_score || 0) - (a.updated_score || 0));

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label={`${className} ranking table`}>
        <TableHead>
          <TableRow>
            <TableCell>Rank</TableCell>
            <TableCell>Donor ID</TableCell>
            <TableCell>Initial Score</TableCell>
            <TableCell>SAS updated Score</TableCell>
            <TableCell>SAS Score Visualization</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.map((item, index) => (
            <TableRow key={item.donorID}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{item.donorID}</TableCell>
              <TableCell>{item.score !== null ? item.score.toFixed(2) : 'N/A'}</TableCell>
              <TableCell>{item.updated_score !== null ? item.updated_score.toFixed(2) : 'N/A'}</TableCell>
              <TableCell sx={{ width: '40%' }}>
                <ScoreBar score={item.updated_score} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export function DonorRecipientRanking({ data, classesToShow }) {
  if (!data || !data.scores) {
    return <p>No ranking data available</p>;
  }

  console.log(classesToShow);
  return (
    <div>
         {classesToShow.map((className) => {
        return (
          <Accordion key={className}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{`Class ${className} Rankings`}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ClassRanking classData={data.scores[className]} className={className} />
            </AccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
}