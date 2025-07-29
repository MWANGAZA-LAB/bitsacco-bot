/**
 * Health Check Service for Bitsacco WhatsApp Assistant
 * TypeScript version with enhanced type safety
 * Comprehensive health monitoring for all critical components
 *
 * @author Bitsacco Engineering Team
 * @version 2.0.0 - TypeScript Migration
 */
interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
    responseTime?: number;
    details?: any;
    error?: string;
}
interface ComprehensiveHealthCheck {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    environment: string;
    uptime: number;
    responseTime: number;
    checks: {
        application: HealthCheckResult;
        database: HealthCheckResult;
        redis: HealthCheckResult;
        externalAPIs: HealthCheckResult;
        systemResources: HealthCheckResult;
    };
    summary: {
        totalChecks: number;
        healthyChecks: number;
        degradedChecks: number;
        unhealthyChecks: number;
    };
}
declare class TypedHealthCheckService {
    private checks;
    private startTime;
    private version;
    private environment;
    constructor();
    /**
     * Initialize all health check functions
     */
    private initializeChecks;
    /**
     * Perform a comprehensive health check
     */
    performHealthCheck(): Promise<ComprehensiveHealthCheck>;
    /**
     * Check application health
     */
    private checkApplicationHealth;
    /**
     * Check database health (placeholder)
     */
    private checkDatabaseHealth;
    /**
     * Check Redis health (placeholder)
     */
    private checkRedisHealth;
    /**
     * Check external APIs health
     */
    private checkExternalAPIs;
    /**
     * Check system resources
     */
    private checkSystemResources;
    /**
     * Check Bitsacco API (placeholder)
     */
    private checkBitsaccoAPI;
    /**
     * Check ElevenLabs API (placeholder)
     */
    private checkElevenLabsAPI;
    /**
     * Check OpenAI API (placeholder)
     */
    private checkOpenAIAPI;
    /**
     * Check CoinGecko API (placeholder)
     */
    private checkCoinGeckoAPI;
    /**
     * Calculate summary statistics
     */
    private calculateSummary;
    /**
     * Determine overall status based on individual checks
     */
    private determineOverallStatus;
    /**
     * Get application uptime in milliseconds
     */
    private getUptime;
    /**
     * Get uptime in human-readable format
     */
    getFormattedUptime(): string;
    /**
     * Get basic health status (for quick checks)
     */
    getBasicHealth(): Promise<{
        status: string;
        uptime: number;
        memory: number;
    }>;
}
export declare const typedHealthCheckService: TypedHealthCheckService;
export default typedHealthCheckService;
//# sourceMappingURL=health-check.d.ts.map