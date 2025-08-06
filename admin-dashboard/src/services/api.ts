/**
 * API Service for Bitsacco Admin Dashboard
 * Handles all HTTP requests to the backend API
 */

import axios, { AxiosInstance } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth tokens (if needed)
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Health endpoints
  async getHealth(): Promise<any> {
    const response = await this.client.get('/health');
    return response.data;
  }

  async getDetailedHealth(): Promise<any> {
    const response = await this.client.get('/health/detailed');
    return response.data;
  }

  // User management
  async getUsers(page: number = 1, limit: number = 10): Promise<any> {
    const response = await this.client.get(`/api/users?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getUserById(userId: string): Promise<any> {
    const response = await this.client.get(`/api/users/${userId}`);
    return response.data;
  }

  async updateUser(userId: string, userData: any): Promise<any> {
    const response = await this.client.put(`/api/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId: string): Promise<any> {
    const response = await this.client.delete(`/api/users/${userId}`);
    return response.data;
  }



  async getMetrics(): Promise<any> {
    const response = await this.client.get('/api/metrics');
    return response.data;
  }

  // Voice settings
  async getVoiceSettings(): Promise<any> {
    const response = await this.client.get('/api/voice/settings');
    return response.data;
  }

  async updateVoiceSettings(settings: any): Promise<any> {
    const response = await this.client.put('/api/voice/settings', settings);
    return response.data;
  }

  async testVoice(text: string, voiceId: string): Promise<any> {
    const response = await this.client.post('/api/voice/test', {
      text,
      voice_id: voiceId,
    });
    return response.data;
  }

  // System settings
  async getSettings(): Promise<any> {
    const response = await this.client.get('/api/settings');
    return response.data;
  }

  async updateSettings(settings: any): Promise<any> {
    const response = await this.client.put('/api/settings', settings);
    return response.data;
  }

  // WhatsApp service controls
  async getWhatsAppStatus(): Promise<any> {
    const response = await this.client.get('/api/whatsapp/status');
    return response.data;
  }

  async restartWhatsAppService(): Promise<any> {
    const response = await this.client.post('/api/whatsapp/restart');
    return response.data;
  }

  // Bitcoin price
  async getBitcoinPrice(currency: string = 'usd'): Promise<any> {
    const response = await this.client.get(`/api/bitcoin/price?currency=${currency}`);
    return response.data;
  }

  // Message history
  async getMessageHistory(
    page: number = 1,
    limit: number = 50,
    userId?: string
  ): Promise<any> {
    let url = `/api/messages?page=${page}&limit=${limit}`;
    if (userId) {
      url += `&user_id=${userId}`;
    }
    const response = await this.client.get(url);
    return response.data;
  }

  // Analytics
  async getAnalytics(timeframe: string = '24h'): Promise<any> {
    try {
      const response = await this.client.get(`/api/analytics?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      // Return mock data if API is not available
      console.warn('Analytics API not available, returning mock data');
      return this.getMockAnalyticsData();
    }
  }

  private getMockAnalyticsData(): any {
    const now = new Date();
    const mockData = {
      totalUsers: 1247,
      activeUsers: 342,
      messagesProcessed: 8934,
      transactions: 156,
      responseTime: 0.85,
      successRate: 98.5,
      userGrowth: [],
      messageTypes: [
        { type: 'Text', count: 5234, color: '#8884d8' },
        { type: 'Voice', count: 2145, color: '#82ca9d' },
        { type: 'Image', count: 987, color: '#ffc658' },
        { type: 'Document', count: 568, color: '#ff7300' }
      ],
      transactionVolume: [],
      responseTimeHistory: []
    };

    // Generate mock user growth data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      mockData.userGrowth.push({
        date: date.toISOString().split('T')[0],
        users: Math.floor(Math.random() * 50) + 20,
        messages: Math.floor(Math.random() * 200) + 100
      });
    }

    // Generate mock transaction volume data
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now);
      hour.setHours(hour.getHours() - i);
      mockData.transactionVolume.push({
        time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        volume: Math.floor(Math.random() * 10000) + 1000
      });
    }

    // Generate mock response time history
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now);
      hour.setHours(hour.getHours() - i);
      mockData.responseTimeHistory.push({
        time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        responseTime: Math.random() * 2 + 0.5
      });
    }

    return mockData;
  }

  // System logs
  async getLogs(level: string = 'info', limit: number = 100): Promise<any> {
    const response = await this.client.get(`/api/logs?level=${level}&limit=${limit}`);
    return response.data;
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
