import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const apiService = {
  // Dashboard APIs
  getDashboardStats: () => apiClient.get('/api/admin/dashboard'),
  getServiceStatus: () => apiClient.get('/api/admin/services/status'),

  // User Management
  getUsers: (page = 1, limit = 20) =>
    apiClient.get(`/api/admin/users?page=${page}&limit=${limit}`),
  getUserDetail: (userId: string) =>
    apiClient.get(`/api/admin/users/${userId}`),
  updateUser: (userId: string, data: any) =>
    apiClient.put(`/api/admin/users/${userId}`, data),
  deleteUser: (userId: string) =>
    apiClient.delete(`/api/admin/users/${userId}`),

  // Service Management
  restartWhatsAppService: () =>
    apiClient.post('/api/admin/services/whatsapp/restart'),
  restartVoiceService: () =>
    apiClient.post('/api/admin/services/voice/restart'),
  restartAllServices: () =>
    apiClient.post('/api/admin/services/restart'),

  // Voice Settings
  getVoiceSettings: () => apiClient.get('/api/admin/voice/settings'),
  updateVoiceSettings: (settings: any) =>
    apiClient.put('/api/admin/voice/settings', settings),
  testVoiceGeneration: (text: string) =>
    apiClient.post('/api/admin/voice/test', { text }),

  // System Operations
  clearCache: () => apiClient.post('/api/admin/system/clear-cache'),
  getSystemLogs: (limit = 100) =>
    apiClient.get(`/api/admin/system/logs?limit=${limit}`),
  getSystemHealth: () => apiClient.get('/api/admin/system/health'),

  // Analytics
  getAnalytics: (period = '7d') =>
    apiClient.get(`/api/admin/analytics?period=${period}`),
  getUserAnalytics: () => apiClient.get('/api/admin/analytics/users'),
  getMessageAnalytics: () => apiClient.get('/api/admin/analytics/messages'),

  // Settings
  getSettings: () => apiClient.get('/api/admin/settings'),
  updateSettings: (settings: any) =>
    apiClient.put('/api/admin/settings', settings),

  // Authentication
  login: (username: string, password: string) =>
    apiClient.post('/api/admin/auth/login', { username, password }),
  logout: () => apiClient.post('/api/admin/auth/logout'),
  refreshToken: () => apiClient.post('/api/admin/auth/refresh'),
}

export default apiService
