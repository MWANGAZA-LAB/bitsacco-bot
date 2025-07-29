/**
 * Goal Engine Module for Bitsacco WhatsApp Assistant
 * TypeScript version with enhanced type safety
 * Following the exact design document specifications
 *
 * @author Bitsacco Engineering Team
 * @version 2.0.0 - TypeScript Migration
 */
interface GoalData {
    name: string;
    targetAmountKes: number;
    targetDate: string;
    category?: 'emergency' | 'vacation' | 'investment' | 'purchase' | 'other';
    description?: string;
}
interface Goal {
    id: string;
    userId: string;
    phoneNumber: string;
    name: string;
    description?: string;
    targetAmountKes: number;
    currentAmountKes: number;
    targetAmountBTC: number;
    currentAmountBTC: number;
    targetDate: Date;
    category: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    progressPercentage: number;
    milestones: Milestone[];
}
interface Milestone {
    id: string;
    goalId: string;
    percentage: number;
    amountKes: number;
    isReached: boolean;
    reachedAt?: Date;
    reward?: string;
}
interface GoalStats {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    averageProgress: number;
}
interface GoalResult {
    success: boolean;
    goal?: Goal;
    error?: string;
}
declare class TypedGoalEngine {
    private goals;
    private reminders;
    private reminderQueue;
    private isProcessing;
    private cache;
    constructor();
    /**
     * Create a new savings goal
     */
    createGoal(userId: string, phoneNumber: string, goalData: GoalData): Promise<GoalResult>;
    /**
     * Add contribution to a goal
     */
    contributeToGoal(goalId: string, amountKes: number): Promise<GoalResult>;
    /**
     * Get user's goals
     */
    getUserGoals(userId: string): Promise<Goal[]>;
    /**
     * Get goal statistics
     */
    getGoalStats(): GoalStats;
    /**
     * Generate milestones for a goal
     */
    private generateMilestones;
    /**
     * Check and update milestones
     */
    private checkMilestones;
    /**
     * Schedule initial reminder
     */
    private scheduleInitialReminder;
    /**
     * Schedule completion celebration
     */
    private scheduleCompletionCelebration;
    /**
     * Schedule milestone celebration
     */
    private scheduleMilestoneCelebration;
    /**
     * Start reminder processor
     */
    private startReminderProcessor;
    /**
     * Process pending reminders
     */
    private processReminders;
    /**
     * Clear user cache
     */
    private clearUserCache;
    /**
     * Clear expired cache entries
     */
    clearExpiredCache(): void;
}
export declare const typedGoalEngine: TypedGoalEngine;
export default typedGoalEngine;
//# sourceMappingURL=goalEngine.d.ts.map