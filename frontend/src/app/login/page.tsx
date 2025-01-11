'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextField, Button, Box, Container, Paper, Typography } from '@mui/material';

export default function LoginPage() {
  const [apiKey, setApiKey] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Store the API key (you might want to use a more secure method in production)
    localStorage.setItem('flexhireApiKey', apiKey);
    
    // Redirect to profile page
    router.push('/profile');
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Login with Flexhire API Key
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              margin="normal"
              required
              type="password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
            >
              Sign In
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
} 