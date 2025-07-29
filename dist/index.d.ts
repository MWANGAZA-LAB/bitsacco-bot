declare class TypedBitsaccoServer {
    private app;
    private isStarted;
    private services;
    private healthChecks;
    private startTime;
    constructor();
    /**
     * Initialize the Fastify application with all middleware
     */
    private initializeApp;
    /**
     * Register all application routes
     */
    private registerRoutes;
    /**
     * Initialize all services
     */
    private initializeServices;
    /**
     * Get overall health status
     */
    private getHealthStatus;
    /**
     * Get services status
     */
    private getServicesStatus;
    /**
     * Get specific service stats
     */
    private getServiceStats;
    /**
     * Get metrics in Prometheus format
     */
    private getMetrics;
    /**
     * Start the server
     */
    start(): Promise<void>;
    /**
     * Stop the server gracefully
     */
    stop(): Promise<void>;
    /**
     * Get server status
     */
    getStatus(): {
        isStarted: boolean;
        startTime: Date;
        uptime: number;
    };
}
declare const typedServer: TypedBitsaccoServer;
export default typedServer;
//# sourceMappingURL=index.d.ts.map