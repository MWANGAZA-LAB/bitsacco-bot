import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import config from './config/index.js';
import logger from './utils/logger.js';
// Import all services
import authService from './services/auth.js';
import walletService from './services/wallet.ts';
import chamaService from './services/chama.js';
import goalEngine from './services/goalEngine.js';
import voiceSynthesizer from './services/voiceSynthesizer.js';
import aiNLPEngine from './services/aiNlpEngine.js';
import scheduler from './services/scheduler.js';
// Import bot handlers
import whatsappBot from './bots/whatsapp.js';
class TypedBitsaccoServer {
    app = null;
    isStarted = false;
    services = new Map();
    healthChecks = new Map();
    startTime = new Date();
    constructor() {
        logger.info('Bitsacco Server instance created (TypeScript)');
    }
    /**
     * Initialize the Fastify application with all middleware
     */
    async initializeApp() {
        try {
            // Create Fastify instance with logging
            this.app = fastify({
                logger: {
                    level: config.logging?.level || 'info',
                    serializers: {
                        req(request) {
                            return {
                                method: request.method,
                                url: request.url,
                                headers: request.headers,
                                hostname: request.hostname,
                                remoteAddress: request.ip,
                                remotePort: request.socket?.remotePort
                            };
                        },
                        res(response) {
                            return {
                                statusCode: response.statusCode,
                                headers: response.getHeaders()
                            };
                        }
                    }
                },
                trustProxy: config.security?.trustProxy || false,
                disableRequestLogging: false,
                requestIdHeader: 'x-request-id',
                requestIdLogLabel: 'reqId'
            });
            // Register security middleware
            await this.app.register(helmet, {
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ["'self'"],
                        styleSrc: ["'self'", "'unsafe-inline'"],
                        scriptSrc: ["'self'"],
                        imgSrc: ["'self'", "data:", "https:"]
                    }
                },
                crossOriginEmbedderPolicy: false
            });
            // Register CORS
            await this.app.register(cors, {
                origin: config.server?.corsOrigins || ['*'],
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
            });
            // Register rate limiting
            await this.app.register(rateLimit, {
                max: config.server?.rateLimit?.max || 100,
                timeWindow: config.server?.rateLimit?.windowMs || '15 minutes',
                keyGenerator: (request) => {
                    return request.ip;
                },
                errorResponseBuilder: (request, context) => {
                    return {
                        code: 429,
                        error: 'Too Many Requests',
                        message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds.`,
                        date: Date.now(),
                        expiresIn: Math.round(context.ttl / 1000)
                    };
                }
            });
            logger.info('Fastify application initialized with middleware (TypeScript)', {
                cors: config.server?.corsOrigins?.length || 'all',
                rateLimit: config.server?.rateLimit?.max || 100,
                trustProxy: config.security?.trustProxy || false
            });
        }
        catch (error) {
            logger.error('Failed to initialize Fastify application (TypeScript)', { error: error.message });
            throw error;
        }
    }
    /**
     * Register all application routes
     */
    async registerRoutes() {
        if (!this.app) {
            throw new Error('Application not initialized');
        }
        try {
            // Health check endpoint
            this.app.get('/health', async (request, reply) => {
                const health = await this.getHealthStatus();
                const status = health.status === 'healthy' ? 200 : 503;
                reply.code(status).send({
                    status: health.status,
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    version: process.env.npm_package_version || '2.0.0',
                    services: health.services,
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage()
                });
            });
            // Metrics endpoint for monitoring
            this.app.get('/metrics', async (request, reply) => {
                const metrics = await this.getMetrics();
                reply.type('text/plain').send(metrics);
            });
            // WhatsApp webhook endpoints
            this.app.get('/webhook/whatsapp', async (request, reply) => {
                const { query } = request;
                const mode = query['hub.mode'];
                const token = query['hub.verify_token'];
                const challenge = query['hub.challenge'];
                if (mode === 'subscribe' && token === config.whatsapp?.webhookVerifyToken) {
                    logger.info('WhatsApp webhook verified (TypeScript)');
                    reply.send(challenge);
                }
                else {
                    reply.code(403).send('Verification failed');
                }
            });
            this.app.post('/webhook/whatsapp', async (request, reply) => {
                try {
                    // Note: whatsappBot.handleWebhook would need to be implemented
                    // For now, we'll just acknowledge the webhook
                    logger.info('WhatsApp webhook received (TypeScript)', { body: request.body });
                    reply.send({ status: 'ok' });
                }
                catch (error) {
                    logger.error('WhatsApp webhook error (TypeScript)', { error: error.message });
                    reply.code(500).send({ error: 'Webhook processing failed' });
                }
            });
            // API routes for service management
            this.app.get('/api/services/status', async (request, reply) => {
                const services = await this.getServicesStatus();
                reply.send(services);
            });
            this.app.get('/api/services/:serviceName/stats', async (request, reply) => {
                const { serviceName } = request.params;
                const stats = await this.getServiceStats(serviceName);
                if (!stats) {
                    reply.code(404).send({ error: 'Service not found' });
                    return;
                }
                reply.send(stats);
            });
            // Server info endpoint
            this.app.get('/api/info', async (request, reply) => {
                reply.send({
                    name: 'Bitsacco WhatsApp Assistant',
                    version: '2.0.0',
                    environment: config.server?.env || 'development',
                    startTime: this.startTime.toISOString(),
                    uptime: process.uptime(),
                    features: config.features || {},
                    services: Array.from(this.services.keys())
                });
            });
            // Error handlers
            this.app.setErrorHandler((error, request, reply) => {
                logger.error('Request error (TypeScript)', {
                    error: error.message,
                    stack: error.stack,
                    url: request.url,
                    method: request.method,
                    headers: request.headers
                });
                const statusCode = error.statusCode || 500;
                reply.code(statusCode).send({
                    error: 'Internal Server Error',
                    message: statusCode === 500 ? 'Something went wrong' : error.message,
                    timestamp: new Date().toISOString(),
                    requestId: request.id
                });
            });
            this.app.setNotFoundHandler((request, reply) => {
                reply.code(404).send({
                    error: 'Not Found',
                    message: `Route ${request.method} ${request.url} not found`,
                    timestamp: new Date().toISOString()
                });
            });
            logger.info('Application routes registered successfully (TypeScript)');
        }
        catch (error) {
            logger.error('Failed to register routes (TypeScript)', { error: error.message });
            throw error;
        }
    }
    /**
     * Initialize all services
     */
    async initializeServices() {
        try {
            logger.info('Initializing services... (TypeScript)');
            // Store service references
            this.services.set('auth', authService);
            this.services.set('wallet', walletService);
            this.services.set('chama', chamaService);
            this.services.set('goalEngine', goalEngine);
            this.services.set('voiceSynthesizer', voiceSynthesizer);
            this.services.set('aiNLP', aiNLPEngine);
            this.services.set('scheduler', scheduler);
            this.services.set('whatsappBot', whatsappBot);
            // Register health checks for each service
            this.healthChecks.set('auth', () => authService.getStats());
            this.healthChecks.set('wallet', () => walletService.getStats());
            this.healthChecks.set('chama', () => chamaService.getStats());
            this.healthChecks.set('goalEngine', () => goalEngine.getStats());
            this.healthChecks.set('voiceSynthesizer', () => voiceSynthesizer.getStats());
            this.healthChecks.set('aiNLP', () => aiNLPEngine.getStats());
            this.healthChecks.set('scheduler', () => scheduler.getStats());
            this.healthChecks.set('whatsappBot', () => whatsappBot.getStats());
            // Initialize WhatsApp bot if enabled
            if (config.bots?.whatsapp?.enabled) {
                try {
                    await whatsappBot.initialize();
                    logger.info('WhatsApp bot initialized successfully (TypeScript)');
                }
                catch (error) {
                    logger.error('Failed to initialize WhatsApp bot (TypeScript)', { error: error.message });
                    // Don't fail completely if WhatsApp bot fails
                }
            }
            logger.info('All services initialized successfully (TypeScript)', {
                servicesCount: this.services.size,
                healthChecksCount: this.healthChecks.size
            });
        }
        catch (error) {
            logger.error('Failed to initialize services (TypeScript)', { error: error.message });
            throw error;
        }
    }
    /**
     * Get overall health status
     */
    async getHealthStatus() {
        const services = {};
        let overallStatus = 'healthy';
        for (const [name, healthCheck] of this.healthChecks) {
            try {
                const stats = await Promise.resolve(healthCheck());
                services[name] = {
                    status: 'healthy',
                    ...stats
                };
            }
            catch (error) {
                services[name] = {
                    status: 'unhealthy',
                    error: error.message
                };
                overallStatus = 'degraded';
            }
        }
        return {
            status: overallStatus,
            services
        };
    }
    /**
     * Get services status
     */
    async getServicesStatus() {
        const services = {};
        for (const [name, service] of this.services) {
            try {
                if (service.getStats) {
                    const stats = await Promise.resolve(service.getStats());
                    services[name] = {
                        status: 'running',
                        stats
                    };
                }
                else {
                    services[name] = {
                        status: 'running',
                        stats: { message: 'No stats available' }
                    };
                }
            }
            catch (error) {
                services[name] = {
                    status: 'error',
                    error: error.message
                };
            }
        }
        return services;
    }
    /**
     * Get specific service stats
     */
    async getServiceStats(serviceName) {
        const service = this.services.get(serviceName);
        if (!service) {
            return null;
        }
        try {
            if (service.getStats) {
                return await Promise.resolve(service.getStats());
            }
            else {
                return { message: 'No stats available for this service' };
            }
        }
        catch (error) {
            return { error: error.message };
        }
    }
    /**
     * Get metrics in Prometheus format
     */
    async getMetrics() {
        try {
            const health = await this.getHealthStatus();
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            let metrics = '';
            // System metrics
            metrics += `# HELP bitsacco_uptime_seconds Application uptime in seconds\n`;
            metrics += `# TYPE bitsacco_uptime_seconds counter\n`;
            metrics += `bitsacco_uptime_seconds ${process.uptime()}\n\n`;
            metrics += `# HELP bitsacco_memory_usage_bytes Memory usage in bytes\n`;
            metrics += `# TYPE bitsacco_memory_usage_bytes gauge\n`;
            metrics += `bitsacco_memory_usage_bytes{type="rss"} ${memUsage.rss}\n`;
            metrics += `bitsacco_memory_usage_bytes{type="heap_used"} ${memUsage.heapUsed}\n`;
            metrics += `bitsacco_memory_usage_bytes{type="heap_total"} ${memUsage.heapTotal}\n\n`;
            // Service health metrics
            metrics += `# HELP bitsacco_service_health Service health status (1=healthy, 0=unhealthy)\n`;
            metrics += `# TYPE bitsacco_service_health gauge\n`;
            for (const [serviceName, serviceHealth] of Object.entries(health.services)) {
                const healthValue = serviceHealth.status === 'healthy' ? 1 : 0;
                metrics += `bitsacco_service_health{service="${serviceName}"} ${healthValue}\n`;
            }
            return metrics;
        }
        catch (error) {
            logger.error('Failed to generate metrics (TypeScript)', { error: error.message });
            return '# Error generating metrics\n';
        }
    }
    /**
     * Start the server
     */
    async start() {
        try {
            if (this.isStarted) {
                logger.warn('Server is already started (TypeScript)');
                return;
            }
            logger.info('Starting Bitsacco WhatsApp Assistant Server... (TypeScript)', {
                environment: config.server?.env || 'development',
                port: config.server?.port || 3000,
                host: config.server?.host || '0.0.0.0'
            });
            // Initialize application
            await this.initializeApp();
            // Initialize services
            await this.initializeServices();
            // Register routes
            await this.registerRoutes();
            // Start listening
            if (!this.app) {
                throw new Error('Application not initialized');
            }
            await this.app.listen({
                port: config.server?.port || 3000,
                host: config.server?.host || '0.0.0.0'
            });
            this.isStarted = true;
            logger.info('🚀 Bitsacco WhatsApp Assistant Server started successfully! (TypeScript)', {
                port: config.server?.port || 3000,
                host: config.server?.host || '0.0.0.0',
                environment: config.server?.env || 'development',
                services: this.services.size,
                features: Object.keys(config.features || {}).filter(key => config.features?.[key]).length
            });
            // Log feature status
            const enabledFeatures = Object.keys(config.features || {}).filter(key => config.features?.[key]);
            const disabledFeatures = Object.keys(config.features || {}).filter(key => !config.features?.[key]);
            logger.info('Feature flags status (TypeScript)', {
                enabled: enabledFeatures,
                disabled: disabledFeatures
            });
        }
        catch (error) {
            logger.error('Failed to start server (TypeScript)', { error: error.message, stack: error.stack });
            throw error;
        }
    }
    /**
     * Stop the server gracefully
     */
    async stop() {
        try {
            if (!this.isStarted) {
                logger.warn('Server is not running (TypeScript)');
                return;
            }
            logger.info('Stopping Bitsacco WhatsApp Assistant Server... (TypeScript)');
            // Stop scheduler
            const schedulerService = this.services.get('scheduler');
            if (schedulerService && schedulerService.shutdown) {
                await Promise.resolve(schedulerService.shutdown());
            }
            // Stop WhatsApp bot
            const whatsappService = this.services.get('whatsappBot');
            if (whatsappService && whatsappService.stop) {
                await Promise.resolve(whatsappService.stop());
            }
            // Close Fastify server
            if (this.app) {
                await this.app.close();
            }
            this.isStarted = false;
            logger.info('Server stopped successfully (TypeScript)');
        }
        catch (error) {
            logger.error('Error stopping server (TypeScript)', { error: error.message });
            throw error;
        }
    }
    /**
     * Get server status
     */
    getStatus() {
        return {
            isStarted: this.isStarted,
            startTime: this.startTime,
            uptime: process.uptime()
        };
    }
}
// Create server instance
const typedServer = new TypedBitsaccoServer();
// Graceful shutdown handlers
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully... (TypeScript)');
    try {
        await typedServer.stop();
        process.exit(0);
    }
    catch (error) {
        logger.error('Error during graceful shutdown (TypeScript)', { error: error.message });
        process.exit(1);
    }
});
process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully... (TypeScript)');
    try {
        await typedServer.stop();
        process.exit(0);
    }
    catch (error) {
        logger.error('Error during graceful shutdown (TypeScript)', { error: error.message });
        process.exit(1);
    }
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception (TypeScript)', { error: error.message, stack: error.stack });
    process.exit(1);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection (TypeScript)', { reason, promise });
    process.exit(1);
});
// Start the server
typedServer.start().catch((error) => {
    logger.error('Failed to start application (TypeScript)', { error: error.message });
    process.exit(1);
});
export default typedServer;
//# sourceMappingURL=index.js.map