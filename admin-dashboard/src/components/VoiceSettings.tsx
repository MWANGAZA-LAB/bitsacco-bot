import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Divider,
} from '@mui/material'
import {
  VoiceChat,
  Settings as SettingsIcon,
  Language,
  Speed,
  VolumeUp,
} from '@mui/icons-material'

import { apiService } from '../services/api'

interface VoiceSettings {
  enabled: boolean
  default_voice: string
  language: string
  speech_rate: number
  volume: number
  auto_voice_response: boolean
  voice_quality: string
}

const VoiceSettings: React.FC = () => {
  const [settings, setSettings] = useState<VoiceSettings>({
    enabled: true,
    default_voice: 'default',
    language: 'en',
    speech_rate: 1.0,
    volume: 0.8,
    auto_voice_response: false,
    voice_quality: 'high',
  })
  const [loading, setLoading] = useState(false)
  const [testText, setTestText] = useState('Hello! This is a test voice message from Bitsacco.')

  useEffect(() => {
    const fetchVoiceSettings = async () => {
      try {
        const voiceSettings = await apiService.getVoiceSettings()
        setSettings(voiceSettings)
      } catch (error) {
        console.error('Error fetching voice settings:', error)
      }
    }

    fetchVoiceSettings()
  }, [])

  const handleSettingChange = (key: keyof VoiceSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      await apiService.updateVoiceSettings(settings)
      // Show success message
    } catch (error) {
      console.error('Error saving voice settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestVoice = async () => {
    try {
      await apiService.testVoiceGeneration(testText)
    } catch (error) {
      console.error('Error testing voice:', error)
    }
  }

  const availableVoices = [
    { value: 'default', label: 'Default Voice' },
    { value: 'female-1', label: 'Female Voice 1' },
    { value: 'male-1', label: 'Male Voice 1' },
    { value: 'female-2', label: 'Female Voice 2' },
  ]

  const availableLanguages = [
    { value: 'en', label: 'English' },
    { value: 'sw', label: 'Swahili' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <VoiceChat sx={{ mr: 1, verticalAlign: 'middle' }} />
        Voice Settings
      </Typography>

      {/* Voice Service Status */}
      <Alert severity={settings.enabled ? 'success' : 'warning'} sx={{ mb: 3 }}>
        Voice Service is {settings.enabled ? 'Enabled' : 'Disabled'}
        {settings.enabled && ' - Users can send and receive voice messages'}
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Basic Settings
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Enable/Disable Voice Service */}
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enabled}
                  onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                />
              }
              label="Enable Voice Service"
            />

            {/* Auto Voice Response */}
            <FormControlLabel
              control={
                <Switch
                  checked={settings.auto_voice_response}
                  onChange={(e) => handleSettingChange('auto_voice_response', e.target.checked)}
                  disabled={!settings.enabled}
                />
              }
              label="Auto Voice Response (Reply with voice when voice message is received)"
            />

            {/* Default Voice Selection */}
            <FormControl fullWidth disabled={!settings.enabled}>
              <InputLabel>Default Voice</InputLabel>
              <Select
                value={settings.default_voice}
                onChange={(e) => handleSettingChange('default_voice', e.target.value)}
              >
                {availableVoices.map(voice => (
                  <MenuItem key={voice.value} value={voice.value}>
                    {voice.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Language Selection */}
            <FormControl fullWidth disabled={!settings.enabled}>
              <InputLabel>
                <Language sx={{ mr: 1, verticalAlign: 'middle' }} />
                Language
              </InputLabel>
              <Select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
              >
                {availableLanguages.map(lang => (
                  <MenuItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Voice Quality */}
            <FormControl fullWidth disabled={!settings.enabled}>
              <InputLabel>Voice Quality</InputLabel>
              <Select
                value={settings.voice_quality}
                onChange={(e) => handleSettingChange('voice_quality', e.target.value)}
              >
                <MenuItem value="low">Low (Faster processing)</MenuItem>
                <MenuItem value="medium">Medium (Balanced)</MenuItem>
                <MenuItem value="high">High (Best quality)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Advanced Settings
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Speech Rate */}
            <Box>
              <Typography gutterBottom>
                <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
                Speech Rate: {settings.speech_rate}x
              </Typography>
              <Slider
                value={settings.speech_rate}
                onChange={(_, value) => handleSettingChange('speech_rate', value)}
                min={0.5}
                max={2.0}
                step={0.1}
                marks={[
                  { value: 0.5, label: '0.5x' },
                  { value: 1.0, label: '1.0x' },
                  { value: 1.5, label: '1.5x' },
                  { value: 2.0, label: '2.0x' },
                ]}
                disabled={!settings.enabled}
              />
            </Box>

            {/* Volume */}
            <Box>
              <Typography gutterBottom>
                <VolumeUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Volume: {Math.round(settings.volume * 100)}%
              </Typography>
              <Slider
                value={settings.volume}
                onChange={(_, value) => handleSettingChange('volume', value)}
                min={0.1}
                max={1.0}
                step={0.1}
                marks={[
                  { value: 0.1, label: '10%' },
                  { value: 0.5, label: '50%' },
                  { value: 1.0, label: '100%' },
                ]}
                disabled={!settings.enabled}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Voice Testing */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Voice Generation
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Test Text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              disabled={!settings.enabled}
            />

            <Button
              variant="contained"
              onClick={handleTestVoice}
              disabled={!settings.enabled || !testText.trim()}
              sx={{ alignSelf: 'flex-start' }}
            >
              Generate Test Voice
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Save Settings */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip
          label={`ElevenLabs API Status: ${settings.enabled ? 'Connected' : 'Disabled'}`}
          color={settings.enabled ? 'success' : 'default'}
        />

        <Button
          variant="contained"
          size="large"
          onClick={handleSaveSettings}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  )
}

export default VoiceSettings
