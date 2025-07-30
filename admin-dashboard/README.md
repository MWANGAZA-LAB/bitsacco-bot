# Bitsacco Admin Dashboard

A professional React TypeScript admin dashboard for managing the Bitsacco WhatsApp Bot.

## Features

- **User Management**: View, edit, and manage bot users
- **Analytics**: Real-time metrics and usage statistics
- **Voice Settings**: Configure ElevenLabs voice synthesis
- **System Health**: Monitor bot performance and health
- **Message History**: View conversation logs and interactions
- **Settings**: Configure bot behavior and preferences

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Material-UI v5
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Routing**: React Router v6

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

## Configuration

The dashboard connects to the backend API at `http://localhost:8000` by default.

To configure a different API URL, set the `VITE_API_URL` environment variable:

```bash
VITE_API_URL=https://your-api-url.com npm run dev
```

## Project Structure

```text
src/
├── components/          # React components
│   ├── Analytics.tsx    # Analytics dashboard
│   ├── Dashboard.tsx    # Main dashboard
│   ├── Settings.tsx     # System settings
│   ├── UserManagement.tsx  # User management
│   └── VoiceSettings.tsx   # Voice configuration
├── services/            # API services
│   └── api.ts          # HTTP client and API calls
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## API Integration

The dashboard communicates with the FastAPI backend through REST endpoints:

- `/health` - System health status
- `/api/users` - User management
- `/api/analytics` - Usage metrics
- `/api/voice/settings` - Voice configuration
- `/api/settings` - System settings

## Contributing

1. Follow TypeScript best practices
2. Use Material-UI components consistently
3. Implement proper error handling
4. Add appropriate type definitions
5. Test all API integrations
