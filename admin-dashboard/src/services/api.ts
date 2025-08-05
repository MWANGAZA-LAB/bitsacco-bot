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

  // Analytics
  async getAnalytics(timeRange: string = '24h'): Promise<any> {
    const response = await this.client.get(`/api/analytics?range=${timeRange}`);
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

  // System logs
  async getLogs(level: string = 'info', limit: number = 100): Promise<any> {
    const response = await this.client.get(`/api/logs?level=${level}&limit=${limit}`);
    return response.data;
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
