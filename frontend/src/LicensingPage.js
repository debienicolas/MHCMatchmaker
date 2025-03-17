import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
}));

const LicensingPage = () => {
  return (
    <StyledPaper>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Licensing Information
        </Typography>
      </Box>

      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Software License
        </Typography>
        <Typography paragraph>
          MHC Matchmaker is licensed under the MIT License.
        </Typography>
        <Typography variant="body2" paragraph style={{ whiteSpace: 'pre-line' }}>
          {`
          --
            The copyrights of this software are owned by Duke University. As such, two licenses for this software are offered:
            1. An open-source license under the Creative Commons CC BY-NC-ND 4.0 license for non-commercial academic use.
            2. A custom license with Duke University, for commercial use or uses without the CC BY-NC-ND 4.0 license restrictions. 

            As a recipient of this software, you may choose which license to receive the code under. Outside contributions to the Duke-owned code base cannot be accepted unless the contributor transfers the copyright to those changes over to Duke University.
            To enter a custom license agreement without the CC BY-NC-ND 4.0 license restrictions, please contact the Digital Innovations department at the Duke Office for Translation & Commercialization (OTC) (https://otc.duke.edu/digital-innovations/#DI-team) at otcquestions@duke.edu with
            reference to “OTC File No. 8615 in your email. 

            Please note that this software is distributed AS IS, WITHOUT ANY WARRANTY; and without the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
            --
            `}
        </Typography>
      </Box>

      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Data Usage and Citations
        </Typography>
        <Typography paragraph>
          When using MHC Matchmaker in your research, please cite:
        </Typography>
        <Typography paragraph style={{ marginLeft: '20px' }}>
          [Citation information will go here]
        </Typography>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Third-Party Licenses
        </Typography>
        <Typography paragraph>
          This software includes third-party open source software components. The full list of third-party software and their respective licenses can be found in our documentation.
        </Typography>
      </Box>
    </StyledPaper>
  );
};

export default LicensingPage;