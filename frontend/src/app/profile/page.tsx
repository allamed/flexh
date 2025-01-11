'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Container, 
  Box, 
  Avatar, 
  Typography, 
  List, 
  ListItem, 
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  Divider,
  Grid
} from '@mui/material';

type ProfileVisibility = 'private' | 'public' | 'clients_only';

interface Profile {
  name: string;
  avatarUrl: string;
  skills: string[];
  jobApplications: { title: string }[];
  visibility: ProfileVisibility;
}

const transformApiResponse = (data: any): Profile => {
  if (!data?.data?.currentUser) {
    throw new Error(`Invalid API response: ${JSON.stringify(data)}`);
  }

  const user = data.data.currentUser;
  return {
    name: user.name || 'Unknown',
    avatarUrl: user.avatarUrl || '',
    visibility: user.profile?.visibility || 'private',
    skills: user.userSkills?.map((us: any) => us.skill.name) || [],
    jobApplications: user.contracts?.nodes?.map((c: any) => ({ title: c.job.title })) || []
  };
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();

  useEffect(() => {
    const apiKey = localStorage.getItem('flexhireApiKey');
    if (!apiKey) {
      router.push('/login');
      return;
    }

    fetchProfile(apiKey);
  }, [router]);

  const fetchProfile = async (apiKey: string) => {
    try {
      console.log('Fetching with API key:', apiKey);

      const response = await fetch('http://localhost:3000/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'FLEXHIRE-API-KEY': apiKey,
        },
        body: JSON.stringify({
          query: `
            query {
              currentUser {
                name
                avatarUrl
                profile {
                  visibility
                }
                userSkills {
                  skill {
                    name
                  }
                }
                contracts {
                  nodes {
                    job {
                      title
                    }
                  }
                }
              }
            }
          `,
          variables: {}
        })
      });

      const responseText = await response.text();
      console.log('Raw API Response:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed API Response:', data);
      } catch (e) {
        throw new Error(`Failed to parse JSON response: ${responseText}`);
      }

      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      if (!data.data?.currentUser) {
        throw new Error('Invalid or expired API key. Please check your credentials.');
      }

      const transformedData = transformApiResponse(data);
      setProfile(transformedData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // You might want to set an error state here to show to the user
      setProfile(null);
      // If you have an error state:
      // setError(error.message);
    }
  };

  const handleVisibilityChange = async (newVisibility: ProfileVisibility) => {
    const apiKey = localStorage.getItem('flexhireApiKey');
    if (!apiKey) return;

    // Map our frontend values to API enum values
    const visibilityMap = {
      'public': 'visibility_public',
      'clients_only': 'visibility_clients',
      'private': 'visibility_private'
    };

    try {
      await fetch('http://localhost:3000/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'FLEXHIRE-API-KEY': apiKey,
        },
        body: JSON.stringify({
          query: `
            mutation UpdateProfileVisibility($visibility: ProfileVisibilityEnum!) {
              updateUser(input: { profile: { visibility: $visibility } }) {
                user {
                  profile {
                    visibility
                  }
                }
              }
            }
          `,
          variables: {
            visibility: visibilityMap[newVisibility]
          }
        }),
      });

      setProfile(prev => prev ? { ...prev, visibility: newVisibility } : null);
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 6 }}>
        <Paper elevation={3} sx={{ p: 6, borderRadius: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 5,
            gap: 4 
          }}>
            <Avatar
              src={profile.avatarUrl}
              sx={{ 
                width: 120, 
                height: 120,
                boxShadow: 3
              }}
            />
            <Box>
              <Typography variant="h3" sx={{ mb: 1, fontWeight: 'bold' }}>
                {profile.name}
              </Typography>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Profile Visibility</InputLabel>
                <Select
                  size="small"
                  value={profile.visibility}
                  label="Profile Visibility"
                  onChange={(e) => handleVisibilityChange(e.target.value as ProfileVisibility)}
                >
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="clients_only">Clients Only</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 5 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              Skills
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profile.skills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 2,
                    px: 1,
                    '&:hover': { backgroundColor: 'primary.light' }
                  }}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              Job Applications
            </Typography>
            <Grid container spacing={2}>
              {profile.jobApplications.map((job, index) => (
                <Grid item xs={12} key={index}>
                  <Paper 
                    elevation={1}
                    sx={{ 
                      p: 2,
                      '&:hover': {
                        backgroundColor: 'grey.50',
                        transform: 'translateX(6px)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {job.title}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
} 