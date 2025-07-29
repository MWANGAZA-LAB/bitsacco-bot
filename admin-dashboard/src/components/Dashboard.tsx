import React, { useState, useEffect } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Button,
  Alert,
} from '@mui/material'
import {
  TrendingUp,
  People,
  Message,
  VoiceChat,
  Bitcoin,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material'
// Removed unused recharts imports

import { apiService } from '../services/api'

interface DashboardStats {
  total_users: number
  active_users: number
  messages_processed: number
  voice_messages_processed: number
  total_savings: number
  system_uptime: string
  bitcoin_price: number
}

interface ServiceStatus {
  whatsapp: boolean
  voice: boolean
  bitcoin: boolean
  admin: boolean
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, statusResponse] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getServiceStatus(),
        ])
        setStats(statsResponse)
        setServiceStatus(statusResponse)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: boolean) => (status ? 'success' : 'error')
  const getStatusIcon = (status: boolean) =>
    status ? <CheckCircle color="success" /> : <Error color="error" />

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount)

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: <People sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary.main',
    },
    {
      title: 'Active Users',
      value: stats?.active_users || 0,
      icon: <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success.main',
    },
    {
      title: 'Messages Today',
      value: stats?.messages_processed || 0,
      icon: <Message sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info.main',
    },
    {
      title: 'Voice Messages',
      value: stats?.voice_messages_processed || 0,
      icon: <VoiceChat sx={{ fontSize: 40, color: 'secondary.main' }} />,
      color: 'secondary.main',
    },
    {
      title: 'Total Savings',
      value: formatCurrency(stats?.total_savings || 0),
      icon: <Bitcoin sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: 'warning.main',
    },
  ]

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading dashboard...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>

      {/* System Status Alert */}
      {serviceStatus && (
        <Alert
          severity={
            Object.values(serviceStatus).every(Boolean) ? 'success' : 'warning'
          }
          sx={{ mb: 3 }}
        >
          System Status:{' '}
          {Object.values(serviceStatus).every(Boolean)
            ? 'All services operational'
            : 'Some services need attention'}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h5" component="div">
                      {card.value}
                    </Typography>
                  </Box>
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Service Status and Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Status
              </Typography>
              <Table size="small">
                <TableBody>
                  {serviceStatus &&
                    Object.entries(serviceStatus).map(([service, status]) => (
                      <TableRow key={service}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getStatusIcon(status)}
                            <Typography sx={{ textTransform: 'capitalize' }}>
                              {service} Service
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status ? 'Online' : 'Offline'}
                            color={getStatusColor(status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => apiService.restartWhatsAppService()}
                >
                  Restart WhatsApp Service
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => apiService.restartVoiceService()}
                >
                  Restart Voice Service
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => apiService.clearCache()}
                >
                  Clear Cache
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Information */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography color="textSecondary">System Uptime</Typography>
              <Typography variant="h6">{stats?.system_uptime || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography color="textSecondary">Bitcoin Price</Typography>
              <Typography variant="h6">
                {stats?.bitcoin_price
                  ? `$${stats.bitcoin_price.toLocaleString()}`
                  : 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Dashboard
