import React from 'react';
import { Box, Typography, Link, Container, Divider } from '@mui/material';
import { Mail} from '@mui/icons-material';

const ContactSection = () => {
  const emailSubject = "Feedback MHC Matchmaker";
  const encodedSubject = encodeURIComponent(emailSubject);
  const mailtoLink = `mailto:nicolas.debie@duke.edu?subject=${encodedSubject}`;

  return (
    <Box
      component="footer"
      className="contact-section"
      sx={{
        py: 2,  // Reduced vertical padding
        px: 2,
        mt: 'auto',
      }}
    >
      <Container maxWidth="sm">
        <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
          Contact Us
        </Typography>
        <Divider sx={{ mb: 2, width: '50%', mx: 'auto' }} />
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
          Have questions or feedback? We'd love to hear from you!
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Link 
            href={mailtoLink}
            color="primary" 
            sx={{ 
              mx: 2, 
              display: 'flex', 
              alignItems: 'center',
              '&:hover': { color: 'primary.dark' }
            }}
          >
            <Mail sx={{ mr: 0.5, fontSize: '1rem' }} />
            Email
          </Link>
          
          <Link 
            href="/licensing"
            color="primary" 
            sx={{ 
              mx: 2, 
              display: 'flex', 
              alignItems: 'center',
              '&:hover': { color: 'primary.dark' }
            }}
          >
            Licensing
          </Link>
        </Box>
        <Divider sx={{ mb: 1, width: '70%', mx: 'auto' }} />
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          {'Copyright © '}
          <Link color="inherit" href="https://your-website.com/">
            Your Website
          </Link>{' '}
          {new Date().getFullYear()}
          {'.'}
        </Typography>
      </Container>
    </Box>
  );
};

export default ContactSection;
