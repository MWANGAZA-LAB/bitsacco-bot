/**
 * Voice Settings Component for Bitsacco WhatsApp Bot Admin
 * Configure ElevenLabs voice service settings and test voice functionality
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Alert,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  VolumeUp,
  Settings,
  Save,
  Refresh,
  TestTube,
  Language,
  RecordVoiceOver,
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface VoiceConfig {
  enabled: boolean;
  apiKey: string;
  voiceId: string;
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
  language: string;
  responseFormat: string;
}

interface VoiceOption {
  id: string;
  name: string;
  description: string;
  preview_url?: string;
  category: string;
  language: string;
}

const VoiceSettings: React.FC = () => {
  const [config, setConfig] = useState<VoiceConfig>({
    enabled: true,
    apiKey: '',
    voiceId: 'rachel',
    stability: 0.75,
    similarityBoost: 0.75,
    style: 0.5,
    useSpeakerBoost: true,
    language: 'en',
    responseFormat: 'mp3_44100_128',
  });

  const [voices, setVoices] = useState<VoiceOption[]>([
    { id: 'rachel', name: 'Rachel', description: 'Young American Female', category: 'Premade', language: 'en' },
    { id: 'daniel', name: 'Daniel', description: 'Middle Aged British Male', category: 'Premade', language: 'en' },
    { id: 'lily', name: 'Lily', description: 'Middle Aged American Female', category: 'Premade', language: 'en' },
    { id: 'sam', name: 'Sam', description: 'Young American Male', category: 'Premade', language: 'en' },
  ]);

  const [testText, setTestText] = useState('Hello! This is a test of the voice service. How does it sound?');
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'sw', name: 'Swahili' },
  ];

  const responseFormats = [
    { value: 'mp3_44100_128', label: 'MP3 44.1kHz 128kbps' },
    { value: 'mp3_44100_192', label: 'MP3 44.1kHz 192kbps' },
    { value: 'pcm_16000', label: 'PCM 16kHz' },
    { value: 'pcm_22050', label: 'PCM 22.05kHz' },
    { value: 'pcm_44100', label: 'PCM 44.1kHz' },
  ];

  const loadVoiceSettings = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Voice settings loaded');
    } catch (error) {
      console.error('Error loading voice settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveVoiceSettings = async () => {
    try {
      setSaveStatus('saving');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      console.error('Error saving voice settings:', error);
    }
  };

  const testVoice = async () => {
    if (!testText.trim()) return;

    try {
      setIsPlaying(true);
      // Simulate voice synthesis and playback
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('Voice test completed');
    } catch (error) {
      console.error('Error testing voice:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleConfigChange = (field: keyof VoiceConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    loadVoiceSettings();
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        Voice Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Service Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Configuration
              </Typography>

              <Box mb={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enabled}
                      onChange={(e) => handleConfigChange('enabled', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Enable Voice Service"
                />
              </Box>

              <TextField
                fullWidth
                label="ElevenLabs API Key"
                type="password"
                value={config.apiKey}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                margin="normal"
                disabled={!config.enabled}
                helperText="Your ElevenLabs API key for voice synthesis"
              />

              <FormControl fullWidth margin="normal" disabled={!config.enabled}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={config.language}
                  label="Language"
                  onChange={(e) => handleConfigChange('language', e.target.value)}
                >
                  {languages.map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" disabled={!config.enabled}>
                <InputLabel>Response Format</InputLabel>
                <Select
                  value={config.responseFormat}
                  label="Response Format"
                  onChange={(e) => handleConfigChange('responseFormat', e.target.value)}
                >
                  {responseFormats.map((format) => (
                    <MenuItem key={format.value} value={format.value}>
                      {format.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Voice Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Voice Selection
              </Typography>

              <FormControl fullWidth margin="normal" disabled={!config.enabled}>
                <InputLabel>Voice</InputLabel>
                <Select
                  value={config.voiceId}
                  label="Voice"
                  onChange={(e) => handleConfigChange('voiceId', e.target.value)}
                >
                  {voices.map((voice) => (
                    <MenuItem key={voice.id} value={voice.id}>
                      <Box>
                        <Typography variant="body1">{voice.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {voice.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box mt={2}>
                <Typography gutterBottom>Available Voices</Typography>
                <List dense>
                  {voices.map((voice) => (
                    <ListItem key={voice.id} divider>
                      <ListItemText
                        primary={voice.name}
                        secondary={
                          <Box>
                            <Typography variant="body2">{voice.description}</Typography>
                            <Box mt={1}>
                              <Chip
                                size="small"
                                label={voice.category}
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                size="small"
                                label={voice.language.toUpperCase()}
                                color="secondary"
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleConfigChange('voiceId', voice.id)}
                          color={config.voiceId === voice.id ? 'primary' : 'default'}
                        >
                          <RecordVoiceOver />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Voice Parameters */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Voice Parameters
              </Typography>

              <Box mb={3}>
                <Typography gutterBottom>Stability: {config.stability}</Typography>
                <Slider
                  value={config.stability}
                  onChange={(_, value) => handleConfigChange('stability', value)}
                  min={0}
                  max={1}
                  step={0.01}
                  disabled={!config.enabled}
                  marks={[
                    { value: 0, label: 'Variable' },
                    { value: 1, label: 'Stable' },
                  ]}
                />
              </Box>

              <Box mb={3}>
                <Typography gutterBottom>Similarity Boost: {config.similarityBoost}</Typography>
                <Slider
                  value={config.similarityBoost}
                  onChange={(_, value) => handleConfigChange('similarityBoost', value)}
                  min={0}
                  max={1}
                  step={0.01}
                  disabled={!config.enabled}
                  marks={[
                    { value: 0, label: 'Low' },
                    { value: 1, label: 'High' },
                  ]}
                />
              </Box>

              <Box mb={3}>
                <Typography gutterBottom>Style: {config.style}</Typography>
                <Slider
                  value={config.style}
                  onChange={(_, value) => handleConfigChange('style', value)}
                  min={0}
                  max={1}
                  step={0.01}
                  disabled={!config.enabled}
                  marks={[
                    { value: 0, label: 'Natural' },
                    { value: 1, label: 'Expressive' },
                  ]}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={config.useSpeakerBoost}
                    onChange={(e) => handleConfigChange('useSpeakerBoost', e.target.checked)}
                    disabled={!config.enabled}
                  />
                }
                label="Use Speaker Boost"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Voice Testing */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Voice Testing
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Test Text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                margin="normal"
                disabled={!config.enabled}
                helperText="Enter text to test the voice synthesis"
              />

              <Box display="flex" gap={2} mt={2}>
                <Button
                  variant="contained"
                  startIcon={isPlaying ? <Stop /> : <PlayArrow />}
                  onClick={testVoice}
                  disabled={!config.enabled || !testText.trim() || loading}
                  color={isPlaying ? "error" : "primary"}
                >
                  {isPlaying ? 'Stop' : 'Test Voice'}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<TestTube />}
                  onClick={() => setTestDialogOpen(true)}
                  disabled={!config.enabled}
                >
                  Advanced Test
                </Button>
              </Box>

              {saveStatus === 'saved' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Voice settings saved successfully!
                </Alert>
              )}

              {saveStatus === 'error' && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Failed to save voice settings. Please try again.
                </Alert>
              )}
            </CardContent>

            <CardActions>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={saveVoiceSettings}
                disabled={saveStatus === 'saving' || loading}
                fullWidth
              >
                {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Advanced Test Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Advanced Voice Testing</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Test different voice parameters and compare results
          </Typography>
          {/* Add advanced testing interface here */}
          <Alert severity="info" sx={{ mt: 2 }}>
            Advanced testing features coming soon...
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VoiceSettings;
