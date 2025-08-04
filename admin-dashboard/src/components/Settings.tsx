/**
 * Settings Component for Bitsacco WhatsApp Bot Admin
 * Configure system settings, integrations, and general preferences
 */

import React, { useState } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save,
  ExpandMore,
  Security,
  Backup,
  Download,
  Upload,
  Refresh,
  PlayArrow,
  CheckCircle,
  Error,
  Palette,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useThemeMode } from '../contexts/ThemeContext';

interface SystemSettings {
  general: {
    appName: string;
    environment: string;
    debugMode: boolean;
    logLevel: string;
    maxUsers: number;
    sessionTimeout: number;
  };
  whatsapp: {
    sessionName: string;
    headless: boolean;
    timeout: number;
    messageDelay: number;
    maxRetries: number;
  };
  bitsacco: {
    apiUrl: string;
    timeout: number;
    retryAttempts: number;
    cacheEnabled: boolean;
  };
  security: {
    requireAuth: boolean;
    rateLimiting: boolean;
    maxRequestsPerMinute: number;
    encryptSessions: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    emailRecipients: string[];
    webhookUrl: string;
    slackEnabled: boolean;
  };
}

const Settings: React.FC = () => {
  const { mode, toggleTheme } = useThemeMode();
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      appName: 'Bitsacco WhatsApp Bot',
      environment: 'production',
      debugMode: false,
      logLevel: 'INFO',
      maxUsers: 1000,
      sessionTimeout: 3600,
    },
    whatsapp: {
      sessionName: 'bitsacco-session',
      headless: true,
      timeout: 60,
      messageDelay: 2,
      maxRetries: 3,
    },
    bitsacco: {
      apiUrl: 'https://api.bitsacco.com',
      timeout: 30,
      retryAttempts: 3,
      cacheEnabled: true,
    },
    security: {
      requireAuth: true,
      rateLimiting: true,
      maxRequestsPerMinute: 60,
      encryptSessions: true,
    },
    notifications: {
      emailEnabled: false,
      emailRecipients: [],
      webhookUrl: '',
      slackEnabled: false,
    },
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [connectionTests, setConnectionTests] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({
    whatsapp: 'idle',
    bitsacco: 'idle',
    database: 'idle',
  });

  const handleSettingChange = (category: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const saveSettings = async () => {
    try {
      setSaveStatus('saving');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      console.error('Error saving settings:', error);
    }
  };

  const testConnection = async (service: string) => {
    setConnectionTests(prev => ({ ...prev, [service]: 'testing' }));

    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      const success = Math.random() > 0.3; // 70% success rate for demo

      setConnectionTests(prev => ({
        ...prev,
        [service]: success ? 'success' : 'error'
      }));

      setTimeout(() => {
        setConnectionTests(prev => ({ ...prev, [service]: 'idle' }));
      }, 3000);
    } catch (error) {
      setConnectionTests(prev => ({ ...prev, [service]: 'error' }));
      setTimeout(() => {
        setConnectionTests(prev => ({ ...prev, [service]: 'idle' }));
      }, 3000);
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bitsacco-bot-settings.json';
    link.click();
  };

  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case 'testing':
        return <Refresh className="spin" />;
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      default:
        return <PlayArrow />;
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        System Settings
      </Typography>

      {/* Theme Settings */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center">
            <Palette sx={{ mr: 1 }} />
            <Typography variant="h6">Theme & Appearance</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity="info">
                Customize the appearance of the admin dashboard.
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  {mode === 'dark' ? <Brightness4 sx={{ mr: 1 }} /> : <Brightness7 sx={{ mr: 1 }} />}
                  <Typography variant="body1">
                    Dark Mode
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mode === 'dark'}
                      onChange={toggleTheme}
                      color="primary"
                    />
                  }
                  label={mode === 'dark' ? 'Enabled' : 'Disabled'}
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Toggle between light and dark themes. Your preference will be saved automatically.
              </Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* General Settings */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">General Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Application Name"
                value={settings.general.appName}
                onChange={(e) => handleSettingChange('general', 'appName', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Environment</InputLabel>
                <Select
                  value={settings.general.environment}
                  label="Environment"
                  onChange={(e) => handleSettingChange('general', 'environment', e.target.value)}
                >
                  <MenuItem value="development">Development</MenuItem>
                  <MenuItem value="staging">Staging</MenuItem>
                  <MenuItem value="production">Production</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Log Level</InputLabel>
                <Select
                  value={settings.general.logLevel}
                  label="Log Level"
                  onChange={(e) => handleSettingChange('general', 'logLevel', e.target.value)}
                >
                  <MenuItem value="DEBUG">Debug</MenuItem>
                  <MenuItem value="INFO">Info</MenuItem>
                  <MenuItem value="WARNING">Warning</MenuItem>
                  <MenuItem value="ERROR">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Concurrent Users"
                value={settings.general.maxUsers}
                onChange={(e) => handleSettingChange('general', 'maxUsers', parseInt(e.target.value))}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.general.debugMode}
                    onChange={(e) => handleSettingChange('general', 'debugMode', e.target.checked)}
                  />
                }
                label="Debug Mode"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* WhatsApp Settings */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">WhatsApp Configuration</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Session Name"
                value={settings.whatsapp.sessionName}
                onChange={(e) => handleSettingChange('whatsapp', 'sessionName', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Connection Timeout (seconds)"
                value={settings.whatsapp.timeout}
                onChange={(e) => handleSettingChange('whatsapp', 'timeout', parseInt(e.target.value))}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Message Delay (seconds)"
                value={settings.whatsapp.messageDelay}
                onChange={(e) => handleSettingChange('whatsapp', 'messageDelay', parseFloat(e.target.value))}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Retry Attempts"
                value={settings.whatsapp.maxRetries}
                onChange={(e) => handleSettingChange('whatsapp', 'maxRetries', parseInt(e.target.value))}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.whatsapp.headless}
                    onChange={(e) => handleSettingChange('whatsapp', 'headless', e.target.checked)}
                  />
                }
                label="Headless Mode (No Browser UI)"
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={getTestStatusIcon(connectionTests.whatsapp)}
                  onClick={() => testConnection('whatsapp')}
                  disabled={connectionTests.whatsapp === 'testing'}
                >
                  Test WhatsApp Connection
                </Button>
                {connectionTests.whatsapp === 'success' && (
                  <Chip label="Connected" color="success" size="small" />
                )}
                {connectionTests.whatsapp === 'error' && (
                  <Chip label="Connection Failed" color="error" size="small" />
                )}
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Bitsacco API Settings */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Bitsacco API Configuration</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API Base URL"
                value={settings.bitsacco.apiUrl}
                onChange={(e) => handleSettingChange('bitsacco', 'apiUrl', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Request Timeout (seconds)"
                value={settings.bitsacco.timeout}
                onChange={(e) => handleSettingChange('bitsacco', 'timeout', parseInt(e.target.value))}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Retry Attempts"
                value={settings.bitsacco.retryAttempts}
                onChange={(e) => handleSettingChange('bitsacco', 'retryAttempts', parseInt(e.target.value))}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.bitsacco.cacheEnabled}
                    onChange={(e) => handleSettingChange('bitsacco', 'cacheEnabled', e.target.checked)}
                  />
                }
                label="Enable Response Caching"
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={getTestStatusIcon(connectionTests.bitsacco)}
                  onClick={() => testConnection('bitsacco')}
                  disabled={connectionTests.bitsacco === 'testing'}
                >
                  Test Bitsacco API
                </Button>
                {connectionTests.bitsacco === 'success' && (
                  <Chip label="API Accessible" color="success" size="small" />
                )}
                {connectionTests.bitsacco === 'error' && (
                  <Chip label="API Error" color="error" size="small" />
                )}
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Security Settings */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center">
            <Security sx={{ mr: 1 }} />
            <Typography variant="h6">Security & Authentication</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.security.requireAuth}
                    onChange={(e) => handleSettingChange('security', 'requireAuth', e.target.checked)}
                  />
                }
                label="Require User Authentication"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.security.rateLimiting}
                    onChange={(e) => handleSettingChange('security', 'rateLimiting', e.target.checked)}
                  />
                }
                label="Enable Rate Limiting"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Requests per Minute"
                value={settings.security.maxRequestsPerMinute}
                onChange={(e) => handleSettingChange('security', 'maxRequestsPerMinute', parseInt(e.target.value))}
                margin="normal"
                disabled={!settings.security.rateLimiting}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.security.encryptSessions}
                    onChange={(e) => handleSettingChange('security', 'encryptSessions', e.target.checked)}
                  />
                }
                label="Encrypt Session Data"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Backup & Restore */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center">
            <Backup sx={{ mr: 1 }} />
            <Typography variant="h6">Backup & Restore</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity="info">
                Export your current settings or import a previously saved configuration.
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Download />}
                onClick={exportSettings}
              >
                Export Settings
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => setBackupDialogOpen(true)}
              >
                Import Settings
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Save Button */}
      <Box mt={4} display="flex" justifyContent="center">
        <Button
          variant="contained"
          size="large"
          startIcon={<Save />}
          onClick={saveSettings}
          disabled={saveStatus === 'saving'}
          sx={{ minWidth: 200 }}
        >
          {saveStatus === 'saving' ? 'Saving...' : 'Save All Settings'}
        </Button>
      </Box>

      {/* Status Messages */}
      {saveStatus === 'saved' && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Settings saved successfully!
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to save settings. Please try again.
        </Alert>
      )}

      {/* Import Dialog */}
      <Dialog open={backupDialogOpen} onClose={() => setBackupDialogOpen(false)}>
        <DialogTitle>Import Settings</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Select a settings file to import:
          </Typography>
          <input
            type="file"
            accept=".json"
            style={{ margin: '20px 0' }}
          />
          <Alert severity="warning">
            Importing will overwrite your current settings. Make sure to export your current settings first if needed.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Import</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
