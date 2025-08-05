/**
 * Dashboard Component - Main overview for Bitsacco WhatsApp Bot Admin
 * Provides quick insights and system status at a glance
 */

import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import { useThemeMode } from '../contexts/ThemeContext';
import {
  PlayArrow,
  Stop,
  Refresh,
  Error,
  Warning,
  Info,
  People,
  Message,
  Computer,
  AttachMoney,
  TrendingUp,
  NotificationsActive,
} from '@mui/icons-material';

interface SystemStatus {
  whatsappConnected: boolean;
  bitsaccoApiStatus: boolean;
  databaseStatus: boolean;
  aiServiceStatus: boolean;
  voiceServiceStatus: boolean;
  uptime: string;
  version: string;
}

interface QuickStats {
  activeUsers: number;
  messagesProcessed: number;
  transactionsToday: number;
  responseTime: number;
  errorRate: number;
}

interface RecentActivity {
  id: string;
  type: 'user_joined' | 'message_sent' | 'transaction' | 'error';
  description: string;
  timestamp: Date;
  severity: 'info' | 'success' | 'warning' | 'error';
}

const Dashboard: React.FC = () => {
  const { mode } = useThemeMode();

  // Glassmorphism card styles
  const glassCardStyle = {
    background: mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '16px',
    boxShadow: mode === 'dark'
      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
      : '0 8px 32px rgba(31, 38, 135, 0.37)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: mode === 'dark'
        ? '0 12px 40px rgba(0, 0, 0, 0.4)'
        : '0 12px 40px rgba(31, 38, 135, 0.5)',
    },
  };

  const [systemStatus] = useState<SystemStatus>({
    whatsappConnected: true,
    bitsaccoApiStatus: true,
    databaseStatus: true,
    aiServiceStatus: true,
    voiceServiceStatus: false,
    uptime: '2d 14h 23m',
    version: '3.0.0',
  });

  const [quickStats] = useState<QuickStats>({
    activeUsers: 89,
    messagesProcessed: 1247,
    transactionsToday: 34,
    responseTime: 1.2,
    errorRate: 0.5,
  });

  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'user_joined',
      description: 'New user registered: +254712345678',
      timestamp: new Date(Date.now() - 300000),
      severity: 'success',
    },
    {
      id: '2',
      type: 'transaction',
      description: 'Transaction completed: KES 500 transfer',
      timestamp: new Date(Date.now() - 600000),
      severity: 'info',
    },
    {
      id: '3',
      type: 'message_sent',
      description: 'Voice message processed successfully',
      timestamp: new Date(Date.now() - 900000),
      severity: 'success',
    },
    {
      id: '4',
      type: 'error',
      description: 'Failed to connect to voice service',
      timestamp: new Date(Date.now() - 1200000),
      severity: 'error',
    },
  ]);

  const [loading, setLoading] = useState(false);

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_joined':
        return <People />;
      case 'message_sent':
        return <Message />;
      case 'transaction':
        return <AttachMoney />;
      case 'error':
        return <Error />;
      default:
        return <Info />;
    }
  };

  const getActivityColor = (severity: RecentActivity['severity']) => {
    switch (severity) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const handleServiceToggle = async (service: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Toggling ${service}`);
    } catch (error) {
      console.error(`Error toggling ${service}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Simulate API call to refresh data
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Dashboard data refreshed');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ position: 'relative', zIndex: 1 }}>
      <Box
        sx={{
          mb: 1,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #FFD700, #FFA500, #FF6B6B)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.25,
            letterSpacing: '0.5px',
          }}
        >
          Dashboard Overview
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            fontSize: '0.95rem',
          }}
        >
          Real-time monitoring of your Bitsacco WhatsApp Bot
        </Typography>
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="h5" component="h1">
          Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* System Status Cards */}
      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={glassCardStyle}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ mb: 2 }}>
                <People
                  sx={{
                    fontSize: 48,
                    color: '#FFD700',
                    mb: 1,
                  }}
                />
              </Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 'bold',
                  color: mode === 'dark' ? '#FFFFFF' : '#1a1a2e',
                  mb: 1,
                }}
              >
                {quickStats.activeUsers}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  fontWeight: 500,
                }}
              >
                Active Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={glassCardStyle}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Message
                  sx={{
                    fontSize: 48,
                    color: '#4CAF50',
                    mb: 1,
                  }}
                />
              </Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 'bold',
                  color: mode === 'dark' ? '#FFFFFF' : '#1a1a2e',
                  mb: 1,
                }}
              >
                {quickStats.messagesProcessed}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  fontWeight: 500,
                }}
              >
                Messages Processed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={glassCardStyle}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ mb: 2 }}>
                <AttachMoney
                  sx={{
                    fontSize: 48,
                    color: '#2196F3',
                    mb: 1,
                  }}
                />
              </Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 'bold',
                  color: mode === 'dark' ? '#FFFFFF' : '#1a1a2e',
                  mb: 1,
                }}
              >
                {quickStats.transactionsToday}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  fontWeight: 500,
                }}
              >
                Transactions Today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={glassCardStyle}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ mb: 2 }}>
                <TrendingUp
                  sx={{
                    fontSize: 48,
                    color: '#FF9800',
                    mb: 1,
                  }}
                />
              </Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 'bold',
                  color: mode === 'dark' ? '#FFFFFF' : '#1a1a2e',
                  mb: 1,
                }}
              >
                {quickStats.responseTime}s
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  fontWeight: 500,
                }}
              >
                Response Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={glassCardStyle}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Warning
                  sx={{
                    fontSize: 48,
                    color: '#F44336',
                    mb: 1,
                  }}
                />
              </Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 'bold',
                  color: mode === 'dark' ? '#FFFFFF' : '#1a1a2e',
                  mb: 1,
                }}
              >
                {quickStats.errorRate}%
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  fontWeight: 500,
                }}
              >
                Error Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Service Controls */}
        <Grid item xs={12} md={6}>
          <Card sx={glassCardStyle}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  color: mode === 'dark' ? '#FFD700' : '#1a1a2e',
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Computer sx={{ color: '#FFD700' }} />
                Service Controls
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography>WhatsApp Service</Typography>
                  <Button
                    variant="contained"
                    color={systemStatus.whatsappConnected ? "error" : "success"}
                    startIcon={systemStatus.whatsappConnected ? <Stop /> : <PlayArrow />}
                    size="small"
                    onClick={() => handleServiceToggle('whatsapp')}
                    disabled={loading}
                  >
                    {systemStatus.whatsappConnected ? 'Stop' : 'Start'}
                  </Button>
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography>Voice Service</Typography>
                  <Button
                    variant="contained"
                    color={systemStatus.voiceServiceStatus ? "error" : "success"}
                    startIcon={systemStatus.voiceServiceStatus ? <Stop /> : <PlayArrow />}
                    size="small"
                    onClick={() => handleServiceToggle('voice')}
                    disabled={loading}
                  >
                    {systemStatus.voiceServiceStatus ? 'Stop' : 'Start'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={glassCardStyle}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  color: mode === 'dark' ? '#FFD700' : '#1a1a2e',
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <NotificationsActive sx={{ color: '#FFD700' }} />
                Recent Activity
              </Typography>
              <List dense>
                {recentActivity.map((activity) => (
                  <ListItem key={activity.id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${getActivityColor(activity.severity)}.main` }}>
                        {getActivityIcon(activity.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.description}
                      secondary={activity.timestamp.toLocaleTimeString()}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Loading Indicator */}
      {loading && (
        <Box mt={2}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
