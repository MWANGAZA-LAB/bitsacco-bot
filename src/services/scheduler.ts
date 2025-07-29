import { performance } from 'perf_hooks';
import logger from '../utils/logger.js';
import goalEngine from './goalEngine.js';
import chamaService from './chama.js';
import authService from './auth.js';

// Inline type definitions for this module
interface ScheduledTask {
  id: string;
  function: () => Promise<void>;
  interval: number;
  options: TaskOptions;
  createdAt: Date;
  lastRun?: Date;
  nextRun: Date;
  runCount: number;
  errorCount: number;
  isActive: boolean;
}

interface TaskOptions {
  retryCount: number;
  retryDelay: number;
  timeout: number;
  runImmediately?: boolean;
}

interface JobExecution {
  jobId: string;
  taskId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'completed' | 'failed' | 'timeout';
  error?: string;
}

/**
 * Scheduler Module for Bitsacco WhatsApp Assistant
 * TypeScript version with enhanced type safety
 * Following the exact design document specifications
 * 
 * @author Bitsacco Engineering Team
 * @version 2.0.0 - TypeScript Migration
 */

interface SchedulerConfig {
  reminder_processing: number;
  session_cleanup: number;
  cache_cleanup: number;
  daily_tips: number;
  weekly_reports: number;
  bitcoin_price_update: number;
  goal_progress_check: number;
  chama_reminders: number;
}

interface ActiveJob {
  jobId: string;
  startTime: Date;
  timeout: NodeJS.Timeout;
}

interface SchedulerStats {
  isRunning: boolean;
  totalTasks: number;
  activeTasks: number;
  inactiveTasks: number;
  runningJobs: number;
  totalJobsExecuted: number;
  successRate: number;
  recentHistory: JobExecution[];
  uptime: number;
  timestamp: string;
}

class TypedScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private activeJobs: Map<string, ActiveJob> = new Map();
  private jobHistory: JobExecution[] = [];
  private isRunning: boolean = false;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  
  // Default job schedules (in milliseconds)
  private readonly schedules: SchedulerConfig = {
    reminder_processing: 5 * 60 * 1000,      // 5 minutes
    session_cleanup: 30 * 60 * 1000,         // 30 minutes
    cache_cleanup: 60 * 60 * 1000,           // 1 hour
    daily_tips: 24 * 60 * 60 * 1000,         // 24 hours
    weekly_reports: 7 * 24 * 60 * 60 * 1000, // 7 days
    bitcoin_price_update: 60 * 1000,         // 1 minute
    goal_progress_check: 6 * 60 * 60 * 1000, // 6 hours
    chama_reminders: 12 * 60 * 60 * 1000     // 12 hours
  };

  constructor() {
    this.initializeScheduler();
  }

  /**
   * Initialize the scheduler with type safety
   */
  private initializeScheduler(): void {
    try {
      this.isRunning = true;
      
      // Start core scheduled tasks with proper typing
      this.scheduleTask('reminder_processing', this.processReminders.bind(this), this.schedules.reminder_processing);
      this.scheduleTask('session_cleanup', this.cleanupSessions.bind(this), this.schedules.session_cleanup);
      this.scheduleTask('cache_cleanup', this.cleanupCaches.bind(this), this.schedules.cache_cleanup);
      this.scheduleTask('daily_tips', this.sendDailyTips.bind(this), this.schedules.daily_tips);
      this.scheduleTask('weekly_reports', this.sendWeeklyReports.bind(this), this.schedules.weekly_reports);
      this.scheduleTask('bitcoin_price_update', this.updateBitcoinPrices.bind(this), this.schedules.bitcoin_price_update);
      this.scheduleTask('goal_progress_check', this.checkGoalProgress.bind(this), this.schedules.goal_progress_check);
      this.scheduleTask('chama_reminders', this.sendChamaReminders.bind(this), this.schedules.chama_reminders);

      logger.info('TypeScript Scheduler initialized successfully', {
        tasks: this.tasks.size,
        intervals: this.intervals.size,
        type: 'typescript'
      });

    } catch (error: any) {
      logger.error('Scheduler initialization failed', { error: error.message });
    }
  }

  /**
   * Schedule a recurring task with enhanced type safety
   */
  public scheduleTask(
    taskId: string, 
    taskFunction: () => Promise<void>, 
    interval: number, 
    options: Partial<TaskOptions> = {}
  ): void {
    try {
      // Clear existing task if it exists
      if (this.intervals.has(taskId)) {
        clearInterval(this.intervals.get(taskId)!);
      }

      const task: ScheduledTask = {
        id: taskId,
        function: taskFunction,
        interval,
        options: {
          retryCount: 3,
          retryDelay: 5000,
          timeout: 30000,
          ...options
        },
        createdAt: new Date(),
        nextRun: new Date(Date.now() + interval),
        runCount: 0,
        errorCount: 0,
        isActive: true
      };

      // Store task
      this.tasks.set(taskId, task);

      // Schedule the task with proper timeout typing
      const intervalId: NodeJS.Timeout = setInterval(async () => {
        await this.executeTask(taskId);
      }, interval);

      this.intervals.set(taskId, intervalId);

      // Run immediately if specified
      if (options.runImmediately) {
        setImmediate(() => this.executeTask(taskId));
      }

      logger.info('Task scheduled successfully', {
        taskId,
        interval,
        nextRun: task.nextRun,
        typeScript: true
      });

    } catch (error: any) {
      logger.error('Task scheduling failed', {
        taskId,
        error: error.message
      });
    }
  }

  /**
   * Execute a scheduled task with comprehensive error handling
   */
  private async executeTask(taskId: string): Promise<void> {
    const startTime = performance.now();
    const task = this.tasks.get(taskId);
    
    if (!task || !task.isActive) {
      return;
    }

    // Check if task is already running
    if (this.activeJobs.has(taskId)) {
      logger.warn('Task already running, skipping execution', { taskId });
      return;
    }

    const jobId = `${taskId}_${Date.now()}`;
    
    try {
      // Mark as active with proper timeout typing
      const timeout: NodeJS.Timeout = setTimeout(() => {
        this.timeoutTask(taskId, jobId);
      }, task.options.timeout);

      this.activeJobs.set(taskId, {
        jobId,
        startTime: new Date(),
        timeout
      });

      // Execute task with timeout protection
      await Promise.race([
        task.function(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Task timeout')), task.options.timeout)
        )
      ]);

      // Update task statistics
      task.lastRun = new Date();
      task.nextRun = new Date(Date.now() + task.interval);
      task.runCount++;

      // Clean up active job
      const job = this.activeJobs.get(taskId);
      if (job?.timeout) {
        clearTimeout(job.timeout);
      }
      this.activeJobs.delete(taskId);

      const responseTime = Math.round(performance.now() - startTime);

      const jobExecution: JobExecution = {
        jobId,
        taskId,
        startTime: job?.startTime || new Date(),
        endTime: new Date(),
        duration: responseTime,
        status: 'completed'
      };

      this.jobHistory.push(jobExecution);

      // Trim history to last 100 entries
      if (this.jobHistory.length > 100) {
        this.jobHistory.shift();
      }

      logger.info('Task executed successfully', {
        taskId,
        jobId,
        responseTime,
        runCount: task.runCount,
        typeScript: true
      });

    } catch (error: any) {
      task.errorCount++;
      
      // Clean up active job
      const job = this.activeJobs.get(taskId);
      if (job?.timeout) {
        clearTimeout(job.timeout);
      }
      this.activeJobs.delete(taskId);

      const responseTime = Math.round(performance.now() - startTime);

      // Add to history
      const jobExecution: JobExecution = {
        jobId,
        taskId,
        startTime: job?.startTime || new Date(),
        endTime: new Date(),
        duration: responseTime,
        status: 'failed',
        error: error.message
      };

      this.jobHistory.push(jobExecution);

      logger.error('Task execution failed', {
        taskId,
        jobId,
        error: error.message,
        errorCount: task.errorCount,
        responseTime
      });

      // Disable task if too many errors
      if (task.errorCount >= task.options.retryCount) {
        logger.error('Task disabled due to repeated failures', {
          taskId,
          errorCount: task.errorCount
        });
        this.disableTask(taskId);
      }
    }
  }

  /**
   * Process reminders with type safety
   */
  private async processReminders(): Promise<void> {
    try {
      logger.debug('Processing reminders (TypeScript)');
      // Implementation would go here
    } catch (error: any) {
      logger.error('Reminder processing failed', { error: error.message });
    }
  }

  /**
   * Clean up expired sessions
   */
  private async cleanupSessions(): Promise<void> {
    try {
      logger.debug('Cleaning up expired sessions (TypeScript)');
      // TODO: Implement session cleanup when auth service is ready
      const auth = authService as any;
      if (auth && typeof auth.cleanupExpiredSessions === 'function') {
        await auth.cleanupExpiredSessions();
      }
    } catch (error: any) {
      logger.error('Session cleanup failed', { error: error.message });
    }
  }

  /**
   * Clean up various caches
   */
  private async cleanupCaches(): Promise<void> {
    try {
      logger.debug('Cleaning up caches (TypeScript)');
      
      // Clean up goal engine cache
      const goal = goalEngine as any;
      if (goal && typeof goal.clearExpiredCache === 'function') {
        goal.clearExpiredCache();
      }
      
      // Clean up chama service cache
      const chama = chamaService as any;
      if (chama && typeof chama.clearExpiredCache === 'function') {
        chama.clearExpiredCache();
      }

    } catch (error: any) {
      logger.error('Cache cleanup failed', { error: error.message });
    }
  }

  /**
   * Send daily Bitcoin tips to users
   */
  private async sendDailyTips(): Promise<void> {
    try {
      logger.debug('Sending daily tips (TypeScript)');
      
      const tips: readonly string[] = [
        "💡 Tip: Bitcoin's value tends to increase over time. Consider 'hodling' for long-term gains!",
        "📊 Did you know? Bitcoin has a fixed supply of 21 million coins, making it deflationary.",
        "🎯 Pro tip: Set up automatic savings goals to consistently grow your Bitcoin savings.",
        "🤝 Join a Chama to save Bitcoin with friends and stay motivated!",
        "⚡ Lightning fact: Bitcoin transactions are recorded on an immutable blockchain.",
        "💰 Smart move: Dollar-cost averaging helps reduce the impact of price volatility.",
        "🔒 Security tip: Never share your private keys or recovery phrases with anyone.",
        "📈 Fun fact: Bitcoin has outperformed most traditional investments over the past decade."
      ] as const;

      const todaysTip = tips[new Date().getDay() % tips.length];
      
      logger.info('Daily tip prepared (TypeScript)', { tip: todaysTip });

    } catch (error: any) {
      logger.error('Daily tips failed', { error: error.message });
    }
  }

  /**
   * Send weekly savings reports
   */
  private async sendWeeklyReports(): Promise<void> {
    try {
      logger.debug('Generating weekly reports (TypeScript)');
    } catch (error: any) {
      logger.error('Weekly reports failed', { error: error.message });
    }
  }

  /**
   * Update Bitcoin prices
   */
  private async updateBitcoinPrices(): Promise<void> {
    try {
      logger.debug('Updating Bitcoin prices (TypeScript)');
    } catch (error: any) {
      logger.error('Bitcoin price update failed', { error: error.message });
    }
  }

  /**
   * Check goal progress
   */
  private async checkGoalProgress(): Promise<void> {
    try {
      logger.debug('Checking goal progress (TypeScript)');
    } catch (error: any) {
      logger.error('Goal progress check failed', { error: error.message });
    }
  }

  /**
   * Send chama reminders
   */
  private async sendChamaReminders(): Promise<void> {
    try {
      logger.debug('Sending chama reminders (TypeScript)');
    } catch (error: any) {
      logger.error('Chama reminders failed', { error: error.message });
    }
  }

  /**
   * Handle task timeout
   */
  private timeoutTask(taskId: string, jobId: string): void {
    logger.error('Task timed out (TypeScript)', { taskId, jobId });
    
    const job = this.activeJobs.get(taskId);
    if (job) {
      this.activeJobs.delete(taskId);
      
      const jobExecution: JobExecution = {
        jobId,
        taskId,
        startTime: job.startTime,
        endTime: new Date(),
        duration: Date.now() - job.startTime.getTime(),
        status: 'timeout',
        error: 'Task execution timeout'
      };

      this.jobHistory.push(jobExecution);
    }
  }

  /**
   * Cancel a scheduled task
   */
  public cancelTask(taskId: string): void {
    try {
      // Clear interval
      if (this.intervals.has(taskId)) {
        clearInterval(this.intervals.get(taskId)!);
        this.intervals.delete(taskId);
      }

      // Mark task as inactive
      const task = this.tasks.get(taskId);
      if (task) {
        task.isActive = false;
      }

      // Cancel if currently running
      if (this.activeJobs.has(taskId)) {
        const job = this.activeJobs.get(taskId)!;
        if (job.timeout) {
          clearTimeout(job.timeout);
        }
        this.activeJobs.delete(taskId);
      }

      logger.info('Task cancelled (TypeScript)', { taskId });

    } catch (error: any) {
      logger.error('Task cancellation failed', { taskId, error: error.message });
    }
  }

  /**
   * Disable a task
   */
  public disableTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.isActive = false;
      logger.info('Task disabled (TypeScript)', { taskId });
    }
  }

  /**
   * Enable a task
   */
  public enableTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.isActive = true;
      task.errorCount = 0;
      logger.info('Task enabled (TypeScript)', { taskId });
    }
  }

  /**
   * Get scheduler statistics with proper typing
   */
  public getStats(): SchedulerStats {
    const activeTasks = Array.from(this.tasks.values()).filter(t => t.isActive);
    const inactiveTasks = Array.from(this.tasks.values()).filter(t => !t.isActive);
    const runningJobs = this.activeJobs.size;
    
    const recentHistory = this.jobHistory.slice(-10);
    const successRate = this.jobHistory.length > 0 ? 
      (this.jobHistory.filter(j => j.status === 'completed').length / this.jobHistory.length) * 100 : 0;

    return {
      isRunning: this.isRunning,
      totalTasks: this.tasks.size,
      activeTasks: activeTasks.length,
      inactiveTasks: inactiveTasks.length,
      runningJobs,
      totalJobsExecuted: this.jobHistory.length,
      successRate: Math.round(successRate * 100) / 100,
      recentHistory,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Shutdown the scheduler
   */
  public shutdown(): void {
    try {
      this.isRunning = false;
      
      // Clear all intervals
      for (const [, intervalId] of this.intervals) {
        clearInterval(intervalId);
      }
      this.intervals.clear();

      // Clear active job timeouts
      for (const [, job] of this.activeJobs) {
        if (job.timeout) {
          clearTimeout(job.timeout);
        }
      }
      this.activeJobs.clear();

      logger.info('TypeScript Scheduler shutdown completed');

    } catch (error: any) {
      logger.error('Scheduler shutdown failed', { error: error.message });
    }
  }
}

// Export singleton instance
export const typedScheduler = new TypedScheduler();

export default typedScheduler;
