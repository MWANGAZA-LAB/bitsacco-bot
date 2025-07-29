import { performance } from 'perf_hooks';
class TypedHealthCheckService {
    checks = new Map();
    startTime = Date.now();
    version = process.env.SERVICE_VERSION || '2.0.0';
    environment = process.env.NODE_ENV || 'development';
    constructor() {
        this.initializeChecks();
    }
    /**
     * Initialize all health check functions
     */
    initializeChecks() {
        this.checks.set('application', () => this.checkApplicationHealth());
        this.checks.set('database', () => this.checkDatabaseHealth());
        this.checks.set('redis', () => this.checkRedisHealth());
        this.checks.set('externalAPIs', () => this.checkExternalAPIs());
        this.checks.set('systemResources', () => this.checkSystemResources());
    }
    /**
     * Perform a comprehensive health check
     */
    async performHealthCheck() {
        const startTime = performance.now();
        try {
            // Core health checks
            const results = await Promise.allSettled([
                this.checkApplicationHealth(),
                this.checkDatabaseHealth(),
                this.checkRedisHealth(),
                this.checkExternalAPIs(),
                this.checkSystemResources()
            ]);
            const healthData = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: this.version,
                environment: this.environment,
                uptime: this.getUptime(),
                responseTime: Math.round(performance.now() - startTime),
                checks: {
                    application: { status: 'healthy' },
                    database: { status: 'healthy' },
                    redis: { status: 'healthy' },
                    externalAPIs: { status: 'healthy' },
                    systemResources: { status: 'healthy' }
                },
                summary: {
                    totalChecks: 0,
                    healthyChecks: 0,
                    degradedChecks: 0,
                    unhealthyChecks: 0
                }
            };
            // Process results
            const checkNames = [
                'application',
                'database',
                'redis',
                'externalAPIs',
                'systemResources'
            ];
            results.forEach((result, index) => {
                const checkName = checkNames[index];
                if (result.status === 'fulfilled') {
                    healthData.checks[checkName] = result.value;
                }
                else {
                    healthData.checks[checkName] = {
                        status: 'unhealthy',
                        error: result.reason?.message || 'Check failed',
                        responseTime: Math.round(performance.now() - startTime)
                    };
                }
            });
            // Calculate summary
            healthData.summary = this.calculateSummary(healthData.checks);
            // Determine overall status
            healthData.status = this.determineOverallStatus(healthData.summary);
            return healthData;
        }
        catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                version: this.version,
                environment: this.environment,
                uptime: this.getUptime(),
                responseTime: Math.round(performance.now() - startTime),
                checks: {
                    application: { status: 'unhealthy', error: error.message },
                    database: { status: 'unhealthy', error: 'Not checked due to previous failure' },
                    redis: { status: 'unhealthy', error: 'Not checked due to previous failure' },
                    externalAPIs: { status: 'unhealthy', error: 'Not checked due to previous failure' },
                    systemResources: { status: 'unhealthy', error: 'Not checked due to previous failure' }
                },
                summary: {
                    totalChecks: 5,
                    healthyChecks: 0,
                    degradedChecks: 0,
                    unhealthyChecks: 5
                }
            };
        }
    }
    /**
     * Check application health
     */
    async checkApplicationHealth() {
        const startTime = performance.now();
        try {
            // Check process health
            const memoryUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            // Check if memory usage is reasonable (< 1GB)
            const memoryLimitBytes = 1024 * 1024 * 1024; // 1GB
            const isMemoryHealthy = memoryUsage.heapUsed < memoryLimitBytes;
            // Check uptime (should be running for at least 10 seconds)
            const minUptimeMs = 10 * 1000;
            const isUptimeHealthy = this.getUptime() > minUptimeMs;
            const responseTime = Math.round(performance.now() - startTime);
            if (isMemoryHealthy && isUptimeHealthy) {
                return {
                    status: 'healthy',
                    message: 'Application is running normally',
                    responseTime,
                    details: {
                        memory: {
                            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                            external: Math.round(memoryUsage.external / 1024 / 1024)
                        },
                        uptime: this.getUptime(),
                        pid: process.pid
                    }
                };
            }
            else {
                return {
                    status: 'degraded',
                    message: 'Application has resource concerns',
                    responseTime,
                    details: {
                        memoryHealthy: isMemoryHealthy,
                        uptimeHealthy: isUptimeHealthy,
                        memoryUsage: Math.round(memoryUsage.heapUsed / 1024 / 1024)
                    }
                };
            }
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: 'Application health check failed',
                error: error.message,
                responseTime: Math.round(performance.now() - startTime)
            };
        }
    }
    /**
     * Check database health (placeholder)
     */
    async checkDatabaseHealth() {
        const startTime = performance.now();
        try {
            // Placeholder for actual database health check
            // In a real implementation, you would:
            // 1. Test database connection
            // 2. Execute a simple query (SELECT 1)
            // 3. Check response time
            // 4. Check connection pool status
            // Simulate database check
            await new Promise(resolve => setTimeout(resolve, 10));
            const responseTime = Math.round(performance.now() - startTime);
            // Mock database status - replace with real implementation
            const mockDatabaseStatus = {
                connected: true,
                responseTime,
                poolSize: 10,
                activeConnections: 2
            };
            return {
                status: 'healthy',
                message: 'Database is accessible and responsive',
                responseTime,
                details: mockDatabaseStatus
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: 'Database health check failed',
                error: error.message,
                responseTime: Math.round(performance.now() - startTime)
            };
        }
    }
    /**
     * Check Redis health (placeholder)
     */
    async checkRedisHealth() {
        const startTime = performance.now();
        try {
            // Placeholder for actual Redis health check
            // In a real implementation, you would:
            // 1. Test Redis connection
            // 2. Execute PING command
            // 3. Check response time
            // 4. Check memory usage
            // Simulate Redis check
            await new Promise(resolve => setTimeout(resolve, 5));
            const responseTime = Math.round(performance.now() - startTime);
            // Mock Redis status - replace with real implementation
            const mockRedisStatus = {
                connected: true,
                responseTime,
                memory: '2.5MB',
                keyspaceHits: 1000,
                keyspaceMisses: 50
            };
            return {
                status: 'healthy',
                message: 'Redis is accessible and responsive',
                responseTime,
                details: mockRedisStatus
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: 'Redis health check failed',
                error: error.message,
                responseTime: Math.round(performance.now() - startTime)
            };
        }
    }
    /**
     * Check external APIs health
     */
    async checkExternalAPIs() {
        const startTime = performance.now();
        try {
            // Check various external APIs
            const apiChecks = await Promise.allSettled([
                this.checkBitsaccoAPI(),
                this.checkElevenLabsAPI(),
                this.checkOpenAIAPI(),
                this.checkCoinGeckoAPI()
            ]);
            const apiStatuses = {};
            const apiNames = ['bitsacco', 'elevenlabs', 'openai', 'coingecko'];
            apiChecks.forEach((result, index) => {
                const apiName = apiNames[index];
                if (result.status === 'fulfilled') {
                    apiStatuses[apiName] = result.value;
                }
                else {
                    apiStatuses[apiName] = {
                        status: 'unhealthy',
                        error: result.reason?.message || 'API check failed'
                    };
                }
            });
            const responseTime = Math.round(performance.now() - startTime);
            // Determine overall API health
            const healthyAPIs = Object.values(apiStatuses).filter(api => api.status === 'healthy').length;
            const totalAPIs = Object.keys(apiStatuses).length;
            let status;
            let message;
            if (healthyAPIs === totalAPIs) {
                status = 'healthy';
                message = 'All external APIs are accessible';
            }
            else if (healthyAPIs > totalAPIs / 2) {
                status = 'degraded';
                message = `${healthyAPIs}/${totalAPIs} external APIs are accessible`;
            }
            else {
                status = 'unhealthy';
                message = `Only ${healthyAPIs}/${totalAPIs} external APIs are accessible`;
            }
            return {
                status,
                message,
                responseTime,
                details: apiStatuses
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: 'External API health check failed',
                error: error.message,
                responseTime: Math.round(performance.now() - startTime)
            };
        }
    }
    /**
     * Check system resources
     */
    async checkSystemResources() {
        const startTime = performance.now();
        try {
            const memoryUsage = process.memoryUsage();
            const totalMemory = require('os').totalmem();
            const freeMemory = require('os').freemem();
            const loadAverage = require('os').loadavg();
            const systemResources = {
                memory: {
                    used: memoryUsage.heapUsed,
                    total: totalMemory,
                    percentage: Math.round((memoryUsage.heapUsed / totalMemory) * 100),
                    available: freeMemory
                },
                cpu: {
                    percentage: Math.round(loadAverage[0] * 100), // Approximate CPU usage
                    loadAverage
                },
                disk: {
                // Disk usage would require additional libraries like 'diskusage'
                // For now, we'll just note it's not available
                }
            };
            const responseTime = Math.round(performance.now() - startTime);
            // Determine resource health
            const memoryHealthy = systemResources.memory.percentage < 80; // < 80% memory usage
            const cpuHealthy = systemResources.cpu.percentage < 80; // < 80% CPU usage
            let status;
            let message;
            if (memoryHealthy && cpuHealthy) {
                status = 'healthy';
                message = 'System resources are within normal limits';
            }
            else if (memoryHealthy || cpuHealthy) {
                status = 'degraded';
                message = 'Some system resources are under stress';
            }
            else {
                status = 'unhealthy';
                message = 'System resources are critically high';
            }
            return {
                status,
                message,
                responseTime,
                details: systemResources
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: 'System resource check failed',
                error: error.message,
                responseTime: Math.round(performance.now() - startTime)
            };
        }
    }
    /**
     * Check Bitsacco API (placeholder)
     */
    async checkBitsaccoAPI() {
        const startTime = performance.now();
        try {
            // Simulate API check
            await new Promise(resolve => setTimeout(resolve, 100));
            return {
                status: 'healthy',
                responseTime: Math.round(performance.now() - startTime)
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                responseTime: Math.round(performance.now() - startTime)
            };
        }
    }
    /**
     * Check ElevenLabs API (placeholder)
     */
    async checkElevenLabsAPI() {
        const startTime = performance.now();
        try {
            // Simulate API check
            await new Promise(resolve => setTimeout(resolve, 150));
            return {
                status: 'healthy',
                responseTime: Math.round(performance.now() - startTime)
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                responseTime: Math.round(performance.now() - startTime)
            };
        }
    }
    /**
     * Check OpenAI API (placeholder)
     */
    async checkOpenAIAPI() {
        const startTime = performance.now();
        try {
            // Simulate API check
            await new Promise(resolve => setTimeout(resolve, 200));
            return {
                status: 'healthy',
                responseTime: Math.round(performance.now() - startTime)
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                responseTime: Math.round(performance.now() - startTime)
            };
        }
    }
    /**
     * Check CoinGecko API (placeholder)
     */
    async checkCoinGeckoAPI() {
        const startTime = performance.now();
        try {
            // Simulate API check
            await new Promise(resolve => setTimeout(resolve, 80));
            return {
                status: 'healthy',
                responseTime: Math.round(performance.now() - startTime)
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                responseTime: Math.round(performance.now() - startTime)
            };
        }
    }
    /**
     * Calculate summary statistics
     */
    calculateSummary(checks) {
        const checkValues = Object.values(checks);
        return {
            totalChecks: checkValues.length,
            healthyChecks: checkValues.filter(check => check.status === 'healthy').length,
            degradedChecks: checkValues.filter(check => check.status === 'degraded').length,
            unhealthyChecks: checkValues.filter(check => check.status === 'unhealthy').length
        };
    }
    /**
     * Determine overall status based on individual checks
     */
    determineOverallStatus(summary) {
        if (summary.unhealthyChecks > 0) {
            return 'unhealthy';
        }
        else if (summary.degradedChecks > 0) {
            return 'degraded';
        }
        else {
            return 'healthy';
        }
    }
    /**
     * Get application uptime in milliseconds
     */
    getUptime() {
        return Date.now() - this.startTime;
    }
    /**
     * Get uptime in human-readable format
     */
    getFormattedUptime() {
        const uptimeMs = this.getUptime();
        const seconds = Math.floor(uptimeMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        }
        else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        else {
            return `${seconds}s`;
        }
    }
    /**
     * Get basic health status (for quick checks)
     */
    async getBasicHealth() {
        const memoryUsage = process.memoryUsage();
        return {
            status: 'healthy',
            uptime: this.getUptime(),
            memory: Math.round(memoryUsage.heapUsed / 1024 / 1024)
        };
    }
}
// Export singleton instance
export const typedHealthCheckService = new TypedHealthCheckService();
export default typedHealthCheckService;
//# sourceMappingURL=health-check.js.map