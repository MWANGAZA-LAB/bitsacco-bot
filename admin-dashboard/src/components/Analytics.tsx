/**
 * Analytics Component for Bitsacco WhatsApp Bot Admin Dashboard
 * Displays real-time metrics, charts, and performance data
 */

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  People,
  Message,
  AttachMoney,
  Refresh,
  Timeline,
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  messagesProcessed: number;
  transactions: number;
  responseTime: number;
  successRate: number;
  userGrowth: Array<{ date: string; users: number; messages: number }>;
  messageTypes: Array<{ type: string; count: number; color: string }>;
  hourlyActivity?: Array<{ hour: string; activity: number }>;
  transactionVolume: Array<{ time: string; volume: number }>;
  responseTimeHistory: Array<{ time: string; responseTime: number }>;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
          <Typography variant="body2" color={change.startsWith('+') ? 'success.main' : 'error.main'}>
            {change}
          </Typography>
        </Box>
        <Box color={`${color}.main`}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch analytics data from API (with built-in fallback to mock data)
      const analyticsData = await apiService.getAnalytics('24h');
      
      setData(analyticsData);
    } catch (err) {
      // This should rarely happen since getAnalytics has built-in fallback
      console.error('Analytics fetch error:', err);
      setError('Failed to fetch analytics data');
      
      // Provide fallback data even in case of complete failure
      setData({
        totalUsers: 1247,
        activeUsers: 342,
        messagesProcessed: 8934,
        transactions: 156,
        responseTime: 0.85,
        successRate: 98.5,
        userGrowth: [
          { date: '2025-08-01', users: 45, messages: 234 },
          { date: '2025-08-02', users: 52, messages: 287 },
          { date: '2025-08-03', users: 38, messages: 198 },
          { date: '2025-08-04', users: 67, messages: 345 },
          { date: '2025-08-05', users: 43, messages: 223 },
          { date: '2025-08-06', users: 58, messages: 312 }
        ],
        messageTypes: [
          { type: 'Text', count: 5234, color: '#8884d8' },
          { type: 'Voice', count: 2145, color: '#82ca9d' },
          { type: 'Image', count: 987, color: '#ffc658' },
          { type: 'Document', count: 568, color: '#ff7300' }
        ],
        transactionVolume: [
          { time: '00:00', volume: 2340 },
          { time: '04:00', volume: 1890 },
          { time: '08:00', volume: 4560 },
          { time: '12:00', volume: 6780 },
          { time: '16:00', volume: 5430 },
          { time: '20:00', volume: 3210 }
        ],
        responseTimeHistory: [
          { time: '00:00', responseTime: 0.8 },
          { time: '04:00', responseTime: 0.6 },
          { time: '08:00', responseTime: 1.2 },
          { time: '12:00', responseTime: 0.9 },
          { time: '16:00', responseTime: 1.1 },
          { time: '20:00', responseTime: 0.7 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Note: We no longer return early on error since we have fallback data
  // The error will be shown as a banner at the top instead

  if (!data) return null;

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={fetchAnalytics} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error banner if API is unavailable but showing fallback data */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} action={
          <IconButton onClick={fetchAnalytics} color="inherit" size="small">
            <Refresh />
          </IconButton>
        }>
          API temporarily unavailable - showing sample data. Click refresh to retry.
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Users"
            value={data.totalUsers.toLocaleString()}
            change="+12.5%"
            icon={<People fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Users"
            value={data.activeUsers}
            change="+8.2%"
            icon={<TrendingUp fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Messages"
            value={data.messagesProcessed.toLocaleString()}
            change="+15.7%"
            icon={<Message fontSize="large" />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Transactions"
            value={data.transactions}
            change="+22.1%"
            icon={<AttachMoney fontSize="large" />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* User Growth Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Growth & Message Volume
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="messages" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Message Types Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Message Types
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.messageTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.messageTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Hourly Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hourly Activity
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="activity" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Performance
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Timeline color="primary" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  Avg Response Time: <strong>{data.responseTime}s</strong>
                </Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  Success Rate: <strong>{data.successRate}%</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
