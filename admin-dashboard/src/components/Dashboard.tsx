/**
 * Dashboard Component - Main overview for Bitsacco WhatsApp Bot Admin
 * Provides quick insights and system status at a glance
 */

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Alert,
  Paper,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  CheckCircle,
  Error,
  Warning,
  Info,
  People,
  Message,
  Bluetooth,
  Computer,
  AttachMoney,
  TrendingUp,
  NotificationsActive,
} from '@mui/icons-material';
import { apiService } from '../services/api';

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
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    whatsappConnected: true,
    bitsaccoApiStatus: true,
    databaseStatus: true,
    aiServiceStatus: true,
    voiceServiceStatus: false,
    uptime: '2d 14h 23m',
    version: '3.0.0',
  });

  const [quickStats, setQuickStats] = useState<QuickStats>({
    activeUsers: 89,
    messagesProcessed: 1247,
    transactionsToday: 34,
    responseTime: 1.2,
    errorRate: 0.5,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
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

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle color="success" />
    ) : (
      <Error color="error" />
    );
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'success' : 'error';
  };

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
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
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

      {/* System Status Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={2}>
                  <Box display="flex" alignItems="center" mb={1}>
                    {getStatusIcon(systemStatus.whatsappConnected)}
                    <Typography variant="body2" ml={1}>
                      WhatsApp
                    </Typography>
                  </Box>
                  <Chip
                    label={systemStatus.whatsappConnected ? 'Connected' : 'Disconnected'}
                    color={getStatusColor(systemStatus.whatsappConnected)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Box display="flex" alignItems="center" mb={1}>
                    {getStatusIcon(systemStatus.bitsaccoApiStatus)}
                    <Typography variant="body2" ml={1}>
                      Bitsacco API
                    </Typography>
                  </Box>
                  <Chip
                    label={systemStatus.bitsaccoApiStatus ? 'Online' : 'Offline'}
                    color={getStatusColor(systemStatus.bitsaccoApiStatus)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Box display="flex" alignItems="center" mb={1}>
                    {getStatusIcon(systemStatus.databaseStatus)}
                    <Typography variant="body2" ml={1}>
                      Database
                    </Typography>
                  </Box>
                  <Chip
                    label={systemStatus.databaseStatus ? 'Connected' : 'Error'}
                    color={getStatusColor(systemStatus.databaseStatus)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Box display="flex" alignItems="center" mb={1}>
                    {getStatusIcon(systemStatus.aiServiceStatus)}
                    <Typography variant="body2" ml={1}>
                      AI Service
                    </Typography>
                  </Box>
                  <Chip
                    label={systemStatus.aiServiceStatus ? 'Active' : 'Inactive'}
                    color={getStatusColor(systemStatus.aiServiceStatus)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Box display="flex" alignItems="center" mb={1}>
                    {getStatusIcon(systemStatus.voiceServiceStatus)}
                    <Typography variant="body2" ml={1}>
                      Voice Service
                    </Typography>
                  </Box>
                  <Chip
                    label={systemStatus.voiceServiceStatus ? 'Active' : 'Inactive'}
                    color={getStatusColor(systemStatus.voiceServiceStatus)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Box textAlign="center">
                    <Typography variant="body2" color="textSecondary">
                      Uptime
                    </Typography>
                    <Typography variant="h6">
                      {systemStatus.uptime}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Users
                  </Typography>
                  <Typography variant="h4">
                    {quickStats.activeUsers}
                  </Typography>
                </Box>
                <People color="primary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Messages Today
                  </Typography>
                  <Typography variant="h4">
                    {quickStats.messagesProcessed}
                  </Typography>
                </Box>
                <Message color="secondary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Transactions
                  </Typography>
                  <Typography variant="h4">
                    {quickStats.transactionsToday}
                  </Typography>
                </Box>
                <AttachMoney color="success" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Response Time
                  </Typography>
                  <Typography variant="h4">
                    {quickStats.responseTime}s
                  </Typography>
                </Box>
                <TrendingUp color="info" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Error Rate
                  </Typography>
                  <Typography variant="h4">
                    {quickStats.errorRate}%
                  </Typography>
                </Box>
                <Warning color="warning" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Service Controls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
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
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
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
