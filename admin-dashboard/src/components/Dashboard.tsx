/**
 * Enhanced Dashboard Component - Modern UI for Bitsacco WhatsApp Bot Admin
 * Provides real-time insights, advanced metrics, and improved user experience
 */

import React, { useState, useEffect } from 'react';
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
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  Paper,
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
  Speed,
  Security,
  Storage,
  Wifi,
  CheckCircle,
  Cancel,
  Pause,
  MoreVert,
  Timeline,
  BarChart,
  PieChart,
} from '@mui/icons-material';

interface SystemStatus {
  whatsappConnected: boolean;
  bitsaccoApiStatus: boolean;
  databaseStatus: boolean;
  aiServiceStatus: boolean;
  voiceServiceStatus: boolean;
  uptime: string;
  version: string;
  lastUpdate: Date;
}

interface QuickStats {
  activeUsers: number;
  messagesProcessed: number;
  transactionsToday: number;
  responseTime: number;
  errorRate: number;
  totalRevenue: number;
  conversionRate: number;
  avgSessionDuration: number;
}

interface RecentActivity {
  id: string;
  type: 'user_joined' | 'message_sent' | 'transaction' | 'error' | 'system' | 'security';
  description: string;
  timestamp: Date;
  severity: 'info' | 'success' | 'warning' | 'error';
  user?: string;
  amount?: number;
}

interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
}

const Dashboard: React.FC = () => {
  const { mode } = useThemeMode();
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Enhanced glassmorphism card styles with better animations
  const glassCardStyle = {
    background: mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(255, 255, 255, 0.35)',
    backdropFilter: 'blur(25px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '20px',
    boxShadow: mode === 'dark'
      ? '0 12px 40px rgba(0, 0, 0, 0.4)'
      : '0 12px 40px rgba(31, 38, 135, 0.4)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative' as const,
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: 'linear-gradient(90deg, #FFD700, #FFA500, #FF6B6B)',
      opacity: 0,
      transition: 'opacity 0.3s ease',
    },
    '&:hover': {
      transform: 'translateY(-8px) scale(1.02)',
      boxShadow: mode === 'dark'
        ? '0 20px 60px rgba(0, 0, 0, 0.5)'
        : '0 20px 60px rgba(31, 38, 135, 0.6)',
      '&::before': {
        opacity: 1,
      },
    },
  };

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    whatsappConnected: true,
    bitsaccoApiStatus: true,
    databaseStatus: true,
    aiServiceStatus: true,
    voiceServiceStatus: false,
    uptime: '2d 14h 23m',
    version: '3.0.0',
    lastUpdate: new Date(),
  });

  const [quickStats, setQuickStats] = useState<QuickStats>({
    activeUsers: 89,
    messagesProcessed: 1247,
    transactionsToday: 34,
    responseTime: 1.2,
    errorRate: 0.5,
    totalRevenue: 125000,
    conversionRate: 12.5,
    avgSessionDuration: 8.5,
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 78,
    networkLatency: 120,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'user_joined',
      description: 'New user registered',
      user: '+254712345678',
      timestamp: new Date(Date.now() - 300000),
      severity: 'success',
    },
    {
      id: '2',
      type: 'transaction',
      description: 'Transaction completed',
      amount: 500,
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
    {
      id: '5',
      type: 'security',
      description: 'Security scan completed - No threats detected',
      timestamp: new Date(Date.now() - 1800000),
      severity: 'success',
    },
  ]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

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
      case 'system':
        return <Computer />;
      case 'security':
        return <Security />;
      default:
        return <Info />;
    }
  };

  const getActivityColor = (severity: RecentActivity['severity']) => {
    switch (severity) {
      case 'success':
        return '#4CAF50';
      case 'warning':
        return '#FF9800';
      case 'error':
        return '#F44336';
      default:
        return '#2196F3';
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? '#4CAF50' : '#F44336';
  };

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle /> : <Cancel />;
  };

  const handleServiceToggle = async (service: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update system status
      setSystemStatus(prev => ({
        ...prev,
        [service === 'whatsapp' ? 'whatsappConnected' : 'voiceServiceStatus']: 
          !prev[service === 'whatsapp' ? 'whatsappConnected' : 'voiceServiceStatus'],
        lastUpdate: new Date(),
      }));

      // Add activity log
      const newActivity: RecentActivity = {
        id: Date.now().toString(),
        type: 'system',
        description: `${service} service ${systemStatus[service === 'whatsapp' ? 'whatsappConnected' : 'voiceServiceStatus'] ? 'stopped' : 'started'}`,
        timestamp: new Date(),
        severity: 'info',
      };
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)]);
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
      
      // Update metrics with realistic variations
      setQuickStats(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 3) - 1,
        messagesProcessed: prev.messagesProcessed + Math.floor(Math.random() * 10),
        transactionsToday: prev.transactionsToday + Math.floor(Math.random() * 2),
        responseTime: Math.max(0.5, prev.responseTime + (Math.random() - 0.5) * 0.2),
        errorRate: Math.max(0, Math.min(5, prev.errorRate + (Math.random() - 0.5) * 0.1)),
      }));

      setPerformanceMetrics(prev => ({
        cpuUsage: Math.max(10, Math.min(90, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(20, Math.min(95, prev.memoryUsage + (Math.random() - 0.5) * 5)),
        diskUsage: Math.max(50, Math.min(95, prev.diskUsage + (Math.random() - 0.5) * 2)),
        networkLatency: Math.max(50, Math.min(200, prev.networkLatency + (Math.random() - 0.5) * 20)),
      }));

      setLastRefresh(new Date());
      console.log('Dashboard data refreshed');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Box sx={{ position: 'relative', zIndex: 1 }}>
      {/* Header Section */}
      <Box
        sx={{
          mb: 3,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #FFD700, #FFA500, #FF6B6B, #4ECDC4)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            letterSpacing: '1px',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          Bitsacco WhatsApp Bot
        </Typography>
        <Typography
          variant="h5"
          sx={{
            color: mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
            fontWeight: 500,
            mb: 2,
          }}
        >
          Admin Dashboard
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
            fontSize: '1rem',
          }}
        >
          Real-time monitoring and control center
        </Typography>
      </Box>

      {/* Control Bar */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={3}
        sx={{
          background: glassCardStyle.background,
          backdropFilter: glassCardStyle.backdropFilter,
          border: glassCardStyle.border,
          borderRadius: '12px',
          p: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            System Status
          </Typography>
          <Chip 
            label={`v${systemStatus.version}`} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
          <Chip 
            label={`Uptime: ${systemStatus.uptime}`} 
            size="small" 
            color="success" 
            variant="outlined"
          />
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Last updated: {formatTime(lastRefresh)}
          </Typography>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={loading}
            sx={{
              background: 'linear-gradient(45deg, #FFD700, #FFA500)',
              '&:hover': {
                background: 'linear-gradient(45deg, #FFA500, #FF6B6B)',
              },
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* System Status Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { key: 'whatsappConnected', label: 'WhatsApp', icon: <Message /> },
          { key: 'bitsaccoApiStatus', label: 'Bitsacco API', icon: <Wifi /> },
          { key: 'databaseStatus', label: 'Database', icon: <Storage /> },
          { key: 'aiServiceStatus', label: 'AI Service', icon: <Computer /> },
          { key: 'voiceServiceStatus', label: 'Voice Service', icon: <Speed /> },
        ].map((service) => (
          <Grid item xs={12} sm={6} md={2.4} key={service.key}>
            <Card sx={glassCardStyle}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={{ mb: 1 }}>
                  {React.cloneElement(service.icon, {
                    sx: {
                      fontSize: 32,
                      color: getStatusColor(systemStatus[service.key as keyof SystemStatus]),
                    }
                  })}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  {service.label}
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                  {getStatusIcon(systemStatus[service.key as keyof SystemStatus])}
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {systemStatus[service.key as keyof SystemStatus] ? 'Online' : 'Offline'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Enhanced Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          {
            title: 'Active Users',
            value: quickStats.activeUsers,
            icon: <People />,
            color: '#FFD700',
            trend: '+12%',
            trendColor: '#4CAF50',
          },
          {
            title: 'Messages Processed',
            value: quickStats.messagesProcessed.toLocaleString(),
            icon: <Message />,
            color: '#4CAF50',
            trend: '+8%',
            trendColor: '#4CAF50',
          },
          {
            title: 'Transactions Today',
            value: quickStats.transactionsToday,
            icon: <AttachMoney />,
            color: '#2196F3',
            trend: '+15%',
            trendColor: '#4CAF50',
          },
          {
            title: 'Response Time',
            value: `${quickStats.responseTime}s`,
            icon: <Speed />,
            color: '#FF9800',
            trend: '-5%',
            trendColor: '#4CAF50',
          },
          {
            title: 'Error Rate',
            value: `${quickStats.errorRate}%`,
            icon: <Warning />,
            color: '#F44336',
            trend: '-2%',
            trendColor: '#4CAF50',
          },
        ].map((metric, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <Card sx={glassCardStyle}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{ mb: 2 }}>
                  {React.cloneElement(metric.icon, {
                    sx: {
                      fontSize: 48,
                      color: metric.color,
                      mb: 1,
                    }
                  })}
                </Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 'bold',
                    color: mode === 'dark' ? '#FFFFFF' : '#1a1a2e',
                    mb: 1,
                  }}
                >
                  {metric.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                    fontWeight: 500,
                    mb: 1,
                  }}
                >
                  {metric.title}
                </Typography>
                <Chip
                  label={metric.trend}
                  size="small"
                  sx={{
                    color: metric.trendColor,
                    borderColor: metric.trendColor,
                    fontWeight: 600,
                  }}
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Performance Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={glassCardStyle}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
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
                <BarChart sx={{ color: '#FFD700' }} />
                System Performance
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                {[
                  { label: 'CPU Usage', value: performanceMetrics.cpuUsage, color: '#FF6B6B' },
                  { label: 'Memory Usage', value: performanceMetrics.memoryUsage, color: '#4ECDC4' },
                  { label: 'Disk Usage', value: performanceMetrics.diskUsage, color: '#45B7D1' },
                ].map((metric) => (
                  <Box key={metric.label}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">{metric.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {metric.value}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metric.value}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: `linear-gradient(90deg, ${metric.color}, ${metric.color}dd)`,
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={glassCardStyle}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
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
                <PieChart sx={{ color: '#FFD700' }} />
                Business Metrics
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Total Revenue</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                    {formatCurrency(quickStats.totalRevenue)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Conversion Rate</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                    {quickStats.conversionRate}%
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Avg Session Duration</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                    {quickStats.avgSessionDuration}m
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Network Latency</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#9C27B0' }}>
                    {performanceMetrics.networkLatency}ms
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Enhanced Service Controls */}
        <Grid item xs={12} md={6}>
          <Card sx={glassCardStyle}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
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
                {[
                  { 
                    name: 'WhatsApp Service', 
                    status: systemStatus.whatsappConnected,
                    description: 'Manages WhatsApp Web integration'
                  },
                  { 
                    name: 'Voice Service', 
                    status: systemStatus.voiceServiceStatus,
                    description: 'Handles voice message processing'
                  },
                ].map((service) => (
                  <Box 
                    key={service.name}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {service.name}
                      </Typography>
                      <Chip
                        label={service.status ? 'Running' : 'Stopped'}
                        size="small"
                        color={service.status ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      {service.description}
                    </Typography>
                    <Button
                      variant="contained"
                      color={service.status ? "error" : "success"}
                      startIcon={service.status ? <Stop /> : <PlayArrow />}
                      size="small"
                      onClick={() => handleServiceToggle(service.name.toLowerCase().includes('whatsapp') ? 'whatsapp' : 'voice')}
                      disabled={loading}
                      sx={{
                        background: service.status 
                          ? 'linear-gradient(45deg, #F44336, #D32F2F)'
                          : 'linear-gradient(45deg, #4CAF50, #388E3C)',
                        '&:hover': {
                          background: service.status 
                            ? 'linear-gradient(45deg, #D32F2F, #B71C1C)'
                            : 'linear-gradient(45deg, #388E3C, #2E7D32)',
                        },
                      }}
                    >
                      {service.status ? 'Stop' : 'Start'}
                    </Button>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Enhanced Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={glassCardStyle}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
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
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem 
                      sx={{ 
                        px: 0,
                        '&:hover': {
                          background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                          borderRadius: 1,
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: getActivityColor(activity.severity),
                            width: 40,
                            height: 40,
                          }}
                        >
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {activity.description}
                            </Typography>
                            {activity.user && (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                User: {activity.user}
                              </Typography>
                            )}
                            {activity.amount && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                                Amount: {formatCurrency(activity.amount)}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {formatTime(activity.timestamp)}
                          </Typography>
                        }
                      />
                      <Chip
                        label={activity.severity}
                        size="small"
                        sx={{
                          bgcolor: getActivityColor(activity.severity),
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && (
                      <Divider sx={{ my: 1, opacity: 0.3 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Loading Indicator */}
      {loading && (
        <Box mt={3}>
          <LinearProgress 
            sx={{
              height: 4,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #FFD700, #FFA500, #FF6B6B)',
            }}
          />
        </Box>
      )}

      {/* Auto-refresh notification */}
      {autoRefresh && (
        <Alert 
          severity="info" 
          sx={{ 
            mt: 2,
            background: glassCardStyle.background,
            backdropFilter: glassCardStyle.backdropFilter,
            border: glassCardStyle.border,
          }}
        >
          Auto-refresh enabled - Data updates every 30 seconds
        </Alert>
      )}
    </Box>
  );
};

export default Dashboard;
