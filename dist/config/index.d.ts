interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    pool?: {
        min: number;
        max: number;
        acquire: number;
        idle: number;
    };
}
interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db: number;
}
interface WhatsAppConfig {
    sessionPath: string;
    webhookPath: string;
    webhookVerifyToken?: string;
    maxRetries: number;
    enabled?: boolean;
    sessionName?: string;
}
interface OpenAIConfig {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
}
interface ElevenLabsConfig {
    apiKey: string;
    voiceId: string;
    modelId: string;
    stability: number;
    similarityBoost: number;
    maxTextLength?: number;
}
interface BitcoinServiceConfig {
    network: 'mainnet' | 'testnet';
    apiKey: string;
    apiUrl: string;
    confirmations: number;
}
interface ServerConfig {
    port: number;
    host: string;
    env: string;
    corsOrigins: string[];
    rateLimit: {
        windowMs: number;
        max: number;
    };
}
interface LoggingConfig {
    level: string;
    filename: string;
    maxFiles: number;
    maxSize: number;
    datePattern: string;
    colorize: boolean;
    timestamp: boolean;
    prettyPrint: boolean;
}
interface AppConfig {
    server: ServerConfig;
    database: DatabaseConfig;
    redis: RedisConfig;
    whatsapp: WhatsAppConfig;
    openai: OpenAIConfig;
    elevenlabs: ElevenLabsConfig;
    bitcoin: BitcoinServiceConfig;
    bitsacco: {
        apiKey: string;
        apiUrl: string;
        webhookSecret: string;
        retryAttempts: number;
        timeout: number;
    };
    logging: LoggingConfig;
    security: {
        jwtSecret: string;
        jwtExpiration: string;
        bcryptRounds: number;
        sessionTimeout: number;
        maxLoginAttempts: number;
        lockoutDuration: number;
        trustProxy?: boolean;
    };
    features: {
        voiceEnabled: boolean;
        chamaEnabled: boolean;
        goalTrackingEnabled: boolean;
        schedulerEnabled: boolean;
        analyticsEnabled: boolean;
        aiEnabled: boolean;
        [key: string]: boolean;
    };
    notifications: {
        reminderFrequency: number;
        batchSize: number;
        retryDelay: number;
        maxRetries: number;
    };
    bots?: {
        whatsapp?: {
            enabled?: boolean;
            sessionName?: string;
        };
    };
    storage?: {
        audioPath?: string;
    };
    business?: {
        transactionLimits?: {
            daily?: {
                tier1?: number;
            };
        };
    };
}
export declare const config: AppConfig;
export default config;
//# sourceMappingURL=index.d.ts.map