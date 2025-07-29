import dotenv from 'dotenv';
dotenv.config();
export const config = {
    // Server Configuration
    server: {
        port: parseInt(process.env['PORT'] || '3000'),
        host: process.env['HOST'] || '0.0.0.0',
        env: process.env['NODE_ENV'] || 'development',
        corsOrigins: process.env['CORS_ORIGINS'] ? process.env['CORS_ORIGINS'].split(',') : ['*'],
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        }
    },
    // Database Configuration
    database: {
        host: process.env['POSTGRES_HOST'] || process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['POSTGRES_PORT'] || process.env['DB_PORT'] || '5432'),
        database: process.env['POSTGRES_DB'] || process.env['DB_NAME'] || 'bitsacco',
        username: process.env['POSTGRES_USER'] || process.env['DB_USER'] || 'bitsacco',
        password: process.env['POSTGRES_PASSWORD'] || process.env['DB_PASSWORD'] || 'bitsacco123',
        ssl: process.env['POSTGRES_SSL'] === 'true' || process.env['DB_SSL'] === 'true',
        pool: {
            min: parseInt(process.env['DB_POOL_MIN'] || '2'),
            max: parseInt(process.env['DB_POOL_MAX'] || '10'),
            acquire: parseInt(process.env['DB_ACQUIRE_TIMEOUT'] || '60000'),
            idle: parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000')
        }
    },
    // Redis Configuration
    redis: {
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379'),
        password: process.env['REDIS_PASSWORD'],
        db: parseInt(process.env['REDIS_DB'] || '0')
    },
    // WhatsApp Configuration
    whatsapp: {
        sessionPath: process.env['WHATSAPP_SESSION_PATH'] || './whatsapp-session',
        webhookPath: process.env['WHATSAPP_WEBHOOK_PATH'] || '/webhook',
        webhookVerifyToken: process.env['WHATSAPP_WEBHOOK_VERIFY_TOKEN'],
        maxRetries: parseInt(process.env['WHATSAPP_MAX_RETRIES'] || '3'),
        enabled: process.env['WHATSAPP_ENABLED'] !== 'false',
        sessionName: process.env['WHATSAPP_SESSION_NAME'] || 'bitsacco-session'
    },
    // OpenAI Configuration
    openai: {
        apiKey: process.env['OPENAI_API_KEY'] || '',
        model: process.env['OPENAI_MODEL'] || 'gpt-3.5-turbo',
        maxTokens: parseInt(process.env['OPENAI_MAX_TOKENS'] || '1000'),
        temperature: parseFloat(process.env['OPENAI_TEMPERATURE'] || '0.7')
    },
    // ElevenLabs Configuration
    elevenlabs: {
        apiKey: process.env['ELEVENLABS_API_KEY'] || '',
        voiceId: process.env['ELEVENLABS_VOICE_ID'] || 'pNInz6obpgDQGcFmaJgB',
        modelId: process.env['ELEVENLABS_MODEL_ID'] || 'eleven_multilingual_v2',
        stability: parseFloat(process.env['ELEVENLABS_STABILITY'] || '0.5'),
        similarityBoost: parseFloat(process.env['ELEVENLABS_SIMILARITY_BOOST'] || '0.75'),
        maxTextLength: parseInt(process.env['ELEVENLABS_MAX_TEXT_LENGTH'] || '5000')
    },
    // Bitcoin Service Configuration
    bitcoin: {
        network: process.env['BITCOIN_NETWORK'] || 'testnet',
        apiKey: process.env['BITCOIN_API_KEY'] || '',
        apiUrl: process.env['BITCOIN_API_URL'] || 'https://api.blockcypher.com/v1/btc/test3',
        confirmations: parseInt(process.env['BITCOIN_CONFIRMATIONS'] || '1')
    },
    // Bitsacco API Configuration
    bitsacco: {
        apiKey: process.env['BITSACCO_API_KEY'] || '',
        apiUrl: process.env['BITSACCO_API_URL'] || 'https://api.bitsacco.com/',
        webhookSecret: process.env['BITSACCO_WEBHOOK_SECRET'] || '',
        retryAttempts: parseInt(process.env['BITSACCO_RETRY_ATTEMPTS'] || '3'),
        timeout: parseInt(process.env['BITSACCO_TIMEOUT'] || '30000')
    },
    // Logging Configuration
    logging: {
        level: process.env['LOG_LEVEL'] || 'info',
        filename: process.env['LOG_FILENAME'] || 'bitsacco.log',
        maxFiles: parseInt(process.env['LOG_MAX_FILES'] || '5'),
        maxSize: parseInt(process.env['LOG_MAX_SIZE'] || '10485760'), // 10MB
        datePattern: process.env['LOG_DATE_PATTERN'] || 'YYYY-MM-DD',
        colorize: process.env['LOG_COLORIZE'] !== 'false',
        timestamp: process.env['LOG_TIMESTAMP'] !== 'false',
        prettyPrint: process.env['LOG_PRETTY_PRINT'] !== 'false'
    },
    // Security Configuration
    security: {
        jwtSecret: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-in-production',
        jwtExpiration: process.env['JWT_EXPIRATION'] || '24h',
        bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12'),
        sessionTimeout: parseInt(process.env['SESSION_TIMEOUT'] || '86400000'), // 24 hours
        maxLoginAttempts: parseInt(process.env['MAX_LOGIN_ATTEMPTS'] || '5'),
        lockoutDuration: parseInt(process.env['LOCKOUT_DURATION'] || '300000') // 5 minutes
    },
    // Feature Flags
    features: {
        voiceEnabled: process.env['VOICE_ENABLED'] !== 'false',
        chamaEnabled: process.env['CHAMA_ENABLED'] !== 'false',
        goalTrackingEnabled: process.env['GOAL_TRACKING_ENABLED'] !== 'false',
        schedulerEnabled: process.env['SCHEDULER_ENABLED'] !== 'false',
        analyticsEnabled: process.env['ANALYTICS_ENABLED'] !== 'false',
        aiEnabled: process.env['AI_ENABLED'] !== 'false'
    },
    // Notification Configuration
    notifications: {
        reminderFrequency: parseInt(process.env['REMINDER_FREQUENCY'] || '300000'), // 5 minutes
        batchSize: parseInt(process.env['NOTIFICATION_BATCH_SIZE'] || '50'),
        retryDelay: parseInt(process.env['NOTIFICATION_RETRY_DELAY'] || '5000'),
        maxRetries: parseInt(process.env['NOTIFICATION_MAX_RETRIES'] || '3')
    }
};
export default config;
//# sourceMappingURL=index.js.map