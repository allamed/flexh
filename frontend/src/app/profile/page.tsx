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
  Paper
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
          'Authorization': `Token ${apiKey}`,
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

    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query: `
            mutation UpdateProfileVisibility($visibility: ProfileVisibility!) {
              updateProfile(input: { visibility: $visibility }) {
                profile {
                  visibility
                }
              }
            }
          `,
          variables: {
            visibility: newVisibility
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
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar
              src={profile.avatarUrl}
              sx={{ width: 100, height: 100, mr: 3 }}
            />
            <Typography variant="h4">{profile.name}</Typography>
          </Box>

          <FormControl fullWidth sx={{ mb: 4 }}>
            <InputLabel>Profile Visibility</InputLabel>
            <Select
              value={profile.visibility}
              label="Profile Visibility"
              onChange={(e) => handleVisibilityChange(e.target.value as ProfileVisibility)}
            >
              <MenuItem value="private">Private</MenuItem>
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="clients_only">Clients Only</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="h6" sx={{ mb: 2 }}>Skills</Typography>
          <Box sx={{ mb: 4 }}>
            {profile.skills.map((skill, index) => (
              <Typography key={index} component="span" sx={{ mr: 1 }}>
                {skill}
              </Typography>
            ))}
          </Box>

          <Typography variant="h6" sx={{ mb: 2 }}>Job Applications</Typography>
          <List>
            {profile.jobApplications.map((job, index) => (
              <ListItem key={index}>
                <ListItemText primary={job.title} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </Container>
  );
} 