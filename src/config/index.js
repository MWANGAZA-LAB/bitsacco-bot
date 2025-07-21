import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // General Settings
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Database Configuration
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bitsacco-bot',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    }
  },

  // Bot Tokens
  bots: {
    telegram: {
      token: process.env.TELEGRAM_BOT_TOKEN,
      enabled: !!process.env.TELEGRAM_BOT_TOKEN
    },
    discord: {
      token: process.env.DISCORD_BOT_TOKEN,
      enabled: !!process.env.DISCORD_BOT_TOKEN
    },
    whatsapp: {
      sessionName: process.env.WHATSAPP_SESSION_NAME || 'bitsacco-session',
      enabled: true
    }
  },

  // Bitcoin/Lightning Network
  bitcoin: {
    lightning: {
      nodeUri: process.env.LIGHTNING_NODE_URI,
      macaroon: process.env.LIGHTNING_MACAROON
    },
    rpc: {
      host: process.env.BITCOIN_RPC_HOST || 'localhost',
      port: parseInt(process.env.BITCOIN_RPC_PORT) || 8332,
      user: process.env.BITCOIN_RPC_USER || 'bitcoinrpc',
      pass: process.env.BITCOIN_RPC_PASS
    }
  },

  // Web Server
  web: {
    jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret',
    sessionSecret: process.env.SESSION_SECRET || 'default-session-secret',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },

  // External APIs
  apis: {
    exchangeRateApiKey: process.env.EXCHANGE_RATE_API_KEY,
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL
  },

  // Localization
  i18n: {
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
    supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'en,sw,fr').split(',')
  },

  // Features
  features: {
    payments: process.env.ENABLE_PAYMENTS === 'true',
    notifications: process.env.ENABLE_NOTIFICATIONS === 'true',
    analytics: process.env.ENABLE_ANALYTICS === 'true',
    multilingual: process.env.ENABLE_MULTILINGUAL === 'true'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  }
};

export default config;