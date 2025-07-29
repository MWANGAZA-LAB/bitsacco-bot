import { performance } from 'perf_hooks';

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

interface SystemResources {
  memory: {
    used: number;
    total: number;
    percentage: number;
    available: number;
  };
  cpu: {
    percentage: number;
    loadAverage: number[];
  };
  disk: {
    used?: number;
    total?: number;
    percentage?: number;
  };
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

interface DatabaseStatus {
  connected: boolean;
  responseTime?: number;
  poolSize?: number;
  activeConnections?: number;
}

interface RedisStatus {
  connected: boolean;
  responseTime?: number;
  memory?: string;
  keyspaceHits?: number;
  keyspaceMisses?: number;
}

interface ExternalAPIStatus {
  [serviceName: string]: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime?: number;
    error?: string;
  };
}

class TypedHealthCheckService {
  private checks: Map<string, () => Promise<HealthCheckResult>> = new Map();
  private startTime: number = Date.now();
  private version: string = process.env.SERVICE_VERSION || '2.0.0';
  private environment: string = process.env.NODE_ENV || 'development';

  constructor() {
    this.initializeChecks();
  }

  /**
   * Initialize all health check functions
   */
  private initializeChecks(): void {
    this.checks.set('application', () => this.checkApplicationHealth());
    this.checks.set('database', () => this.checkDatabaseHealth());
    this.checks.set('redis', () => this.checkRedisHealth());
    this.checks.set('externalAPIs', () => this.checkExternalAPIs());
    this.checks.set('systemResources', () => this.checkSystemResources());
  }

  /**
   * Perform a comprehensive health check
   */
  async performHealthCheck(): Promise<ComprehensiveHealthCheck> {
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

      const healthData: ComprehensiveHealthCheck = {
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
      const checkNames: (keyof typeof healthData.checks)[] = [
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
        } else {
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

    } catch (error: any) {
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
  private async checkApplicationHealth(): Promise<HealthCheckResult> {
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
      } else {
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

    } catch (error: any) {
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
  private async checkDatabaseHealth(): Promise<HealthCheckResult> {
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
      const mockDatabaseStatus: DatabaseStatus = {
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

    } catch (error: any) {
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
  private async checkRedisHealth(): Promise<HealthCheckResult> {
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
      const mockRedisStatus: RedisStatus = {
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

    } catch (error: any) {
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
  private async checkExternalAPIs(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    
    try {
      // Check various external APIs
      const apiChecks = await Promise.allSettled([
        this.checkBitsaccoAPI(),
        this.checkElevenLabsAPI(),
        this.checkOpenAIAPI(),
        this.checkCoinGeckoAPI()
      ]);

      const apiStatuses: ExternalAPIStatus = {};
      const apiNames = ['bitsacco', 'elevenlabs', 'openai', 'coingecko'];
      
      apiChecks.forEach((result, index) => {
        const apiName = apiNames[index];
        
        if (result.status === 'fulfilled') {
          apiStatuses[apiName] = result.value;
        } else {
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
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      let message: string;
      
      if (healthyAPIs === totalAPIs) {
        status = 'healthy';
        message = 'All external APIs are accessible';
      } else if (healthyAPIs > totalAPIs / 2) {
        status = 'degraded';
        message = `${healthyAPIs}/${totalAPIs} external APIs are accessible`;
      } else {
        status = 'unhealthy';
        message = `Only ${healthyAPIs}/${totalAPIs} external APIs are accessible`;
      }

      return {
        status,
        message,
        responseTime,
        details: apiStatuses
      };

    } catch (error: any) {
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
  private async checkSystemResources(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    
    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = require('os').totalmem();
      const freeMemory = require('os').freemem();
      const loadAverage = require('os').loadavg();
      
      const systemResources: SystemResources = {
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
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      let message: string;
      
      if (memoryHealthy && cpuHealthy) {
        status = 'healthy';
        message = 'System resources are within normal limits';
      } else if (memoryHealthy || cpuHealthy) {
        status = 'degraded';
        message = 'Some system resources are under stress';
      } else {
        status = 'unhealthy';
        message = 'System resources are critically high';
      }

      return {
        status,
        message,
        responseTime,
        details: systemResources
      };

    } catch (error: any) {
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
  private async checkBitsaccoAPI(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; responseTime?: number; error?: string }> {
    const startTime = performance.now();
    
    try {
      // Simulate API check
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        status: 'healthy',
        responseTime: Math.round(performance.now() - startTime)
      };
    } catch (error: any) {
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
  private async checkElevenLabsAPI(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; responseTime?: number; error?: string }> {
    const startTime = performance.now();
    
    try {
      // Simulate API check
      await new Promise(resolve => setTimeout(resolve, 150));
      
      return {
        status: 'healthy',
        responseTime: Math.round(performance.now() - startTime)
      };
    } catch (error: any) {
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
  private async checkOpenAIAPI(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; responseTime?: number; error?: string }> {
    const startTime = performance.now();
    
    try {
      // Simulate API check
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return {
        status: 'healthy',
        responseTime: Math.round(performance.now() - startTime)
      };
    } catch (error: any) {
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
  private async checkCoinGeckoAPI(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; responseTime?: number; error?: string }> {
    const startTime = performance.now();
    
    try {
      // Simulate API check
      await new Promise(resolve => setTimeout(resolve, 80));
      
      return {
        status: 'healthy',
        responseTime: Math.round(performance.now() - startTime)
      };
    } catch (error: any) {
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
  private calculateSummary(checks: ComprehensiveHealthCheck['checks']): ComprehensiveHealthCheck['summary'] {
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
  private determineOverallStatus(summary: ComprehensiveHealthCheck['summary']): 'healthy' | 'degraded' | 'unhealthy' {
    if (summary.unhealthyChecks > 0) {
      return 'unhealthy';
    } else if (summary.degradedChecks > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Get application uptime in milliseconds
   */
  private getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get uptime in human-readable format
   */
  getFormattedUptime(): string {
    const uptimeMs = this.getUptime();
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get basic health status (for quick checks)
   */
  async getBasicHealth(): Promise<{ status: string; uptime: number; memory: number }> {
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
