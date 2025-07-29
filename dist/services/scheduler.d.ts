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
declare class TypedScheduler {
    private tasks;
    private activeJobs;
    private jobHistory;
    private isRunning;
    private intervals;
    private readonly schedules;
    constructor();
    /**
     * Initialize the scheduler with type safety
     */
    private initializeScheduler;
    /**
     * Schedule a recurring task with enhanced type safety
     */
    scheduleTask(taskId: string, taskFunction: () => Promise<void>, interval: number, options?: Partial<TaskOptions>): void;
    /**
     * Execute a scheduled task with comprehensive error handling
     */
    private executeTask;
    /**
     * Process reminders with type safety
     */
    private processReminders;
    /**
     * Clean up expired sessions
     */
    private cleanupSessions;
    /**
     * Clean up various caches
     */
    private cleanupCaches;
    /**
     * Send daily Bitcoin tips to users
     */
    private sendDailyTips;
    /**
     * Send weekly savings reports
     */
    private sendWeeklyReports;
    /**
     * Update Bitcoin prices
     */
    private updateBitcoinPrices;
    /**
     * Check goal progress
     */
    private checkGoalProgress;
    /**
     * Send chama reminders
     */
    private sendChamaReminders;
    /**
     * Handle task timeout
     */
    private timeoutTask;
    /**
     * Cancel a scheduled task
     */
    cancelTask(taskId: string): void;
    /**
     * Disable a task
     */
    disableTask(taskId: string): void;
    /**
     * Enable a task
     */
    enableTask(taskId: string): void;
    /**
     * Get scheduler statistics with proper typing
     */
    getStats(): SchedulerStats;
    /**
     * Shutdown the scheduler
     */
    shutdown(): void;
}
export declare const typedScheduler: TypedScheduler;
export default typedScheduler;
//# sourceMappingURL=scheduler.d.ts.map