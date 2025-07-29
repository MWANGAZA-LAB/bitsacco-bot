# Bitsacco Admin Dashboard

A modern React-based admin dashboard for managing the Bitsacco WhatsApp Bot with comprehensive monitoring, user management, and voice service controls.

## 🚀 Features

### Core Dashboard
- **Real-time System Monitoring**: Live service status, uptime, and health checks
- **User Analytics**: Active users, message counts, and engagement metrics
- **Bitcoin Integration**: Live Bitcoin prices and savings tracking
- **Service Management**: Start/stop/restart individual services

### Voice Service Management
- **ElevenLabs Integration**: Configure voice settings and quality
- **Language Support**: Multi-language voice generation (English, Swahili, Spanish, French)
- **Voice Testing**: Real-time voice generation testing
- **Audio Controls**: Speech rate, volume, and quality settings

### User Management
- **User Overview**: Complete user database with registration status
- **Session Management**: View and manage active user sessions
- **Analytics**: User behavior patterns and engagement metrics

### System Administration
- **Service Health**: Monitor WhatsApp, Voice, Bitcoin, and Admin services
- **Log Management**: System logs with filtering and search
- **Cache Control**: Redis cache management and clearing
- **Quick Actions**: One-click service operations

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **Build Tool**: Vite
- **Charts**: Recharts for data visualization
- **HTTP Client**: Axios with interceptors
- **Real-time**: Socket.io for live updates

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm/yarn
- Running Bitsacco Bot backend on port 8000

### Setup Steps

1. **Navigate to dashboard directory**:
   ```bash
   cd admin-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**:
   ```bash
   # Create .env file
   echo "VITE_API_BASE_URL=http://localhost:8000" > .env
   ```

4. **Start development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Access dashboard**:
   Open http://localhost:3001 in your browser

## 🔧 Configuration

### Environment Variables
Create `.env` file in the admin-dashboard directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Development
VITE_NODE_ENV=development

# Optional: Authentication
VITE_AUTH_ENABLED=true
```

### API Integration
The dashboard connects to the Bitsacco Bot API endpoints:

- **Dashboard**: `/api/admin/dashboard` - System overview
- **Users**: `/api/admin/users` - User management
- **Services**: `/api/admin/services` - Service control
- **Voice**: `/api/admin/voice` - Voice settings
- **Analytics**: `/api/admin/analytics` - Usage analytics

## 📱 Dashboard Sections

### 1. Dashboard Overview
- System health indicators
- Real-time statistics cards
- Service status monitoring
- Quick action buttons
- Bitcoin price tracking

### 2. Voice Settings
- **Service Control**: Enable/disable voice features
- **Voice Selection**: Choose from available ElevenLabs voices
- **Language Settings**: Configure supported languages
- **Audio Quality**: Adjust speech rate and volume
- **Testing**: Generate test voice messages

### 3. User Management
- User registration status
- Session activity monitoring
- Phone number verification
- User analytics and patterns

### 4. Analytics
- Message volume trends
- User engagement metrics
- Voice message usage
- System performance graphs

### 5. System Settings
- Service configuration
- Log level management
- Cache settings
- Security options

## 🎯 Key Features

### Real-time Monitoring
```typescript
// Automatic dashboard refresh every 30 seconds
useEffect(() => {
  const interval = setInterval(fetchDashboardData, 30000)
  return () => clearInterval(interval)
}, [])
```

### Voice Service Integration
```typescript
// Voice settings management
const handleVoiceSettings = async (settings: VoiceSettings) => {
  await apiService.updateVoiceSettings(settings)
  // Real-time voice testing available
}
```

### Service Health Checks
```typescript
// Live service status monitoring
const serviceStatus = {
  whatsapp: true,  // WhatsApp Web connection
  voice: true,     // ElevenLabs API
  bitcoin: true,   // CoinGecko integration
  admin: true      // Admin service
}
```

## 🔐 Security

### Authentication
- JWT-based admin authentication
- Session management
- Protected routes
- Token refresh handling

### CORS Configuration
- Restricted origins in production
- Secure headers
- API rate limiting

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
# or
yarn build
```

### Serve Static Files
```bash
npm run preview
# or
yarn preview
```

### Docker Deployment
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📊 Performance

### Optimization Features
- **Code Splitting**: Lazy loading for route components
- **Bundle Analysis**: Vite bundle analyzer
- **Caching**: Aggressive caching for static assets
- **Compression**: Gzip compression in production

### Monitoring
- Real-time service health
- API response time tracking
- Error boundary implementation
- Performance metrics

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**:
   - Verify backend is running on port 8000
   - Check CORS settings
   - Confirm API base URL in .env

2. **Voice Service Unavailable**:
   - Verify ElevenLabs API key
   - Check voice service initialization
   - Review voice settings configuration

3. **Dashboard Not Loading**:
   - Clear browser cache
   - Check console for JavaScript errors
   - Verify Node.js version compatibility

### Debug Mode
```bash
# Enable verbose logging
VITE_DEBUG=true npm run dev
```

## 🔄 Updates

### Keeping Dashboard Updated
```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm update

# Rebuild
npm run build
```

## 📝 License

This admin dashboard is part of the Bitsacco WhatsApp Bot project and follows the same MIT License terms.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For dashboard-specific support:
- Create GitHub issue with `[Dashboard]` prefix
- Include browser console logs
- Specify Node.js and npm versions
- Provide steps to reproduce

---

**Built with ❤️ for Bitsacco SACCO - Empowering Bitcoin Savings through WhatsApp**
