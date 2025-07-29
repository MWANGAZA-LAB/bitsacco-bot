import { performance } from 'perf_hooks';
import logger from '../utils/logger.js';
class TypedGoalEngine {
    goals = new Map();
    reminders = new Map();
    reminderQueue = [];
    isProcessing = false;
    cache = new Map();
    constructor() {
        // Start reminder processing
        this.startReminderProcessor();
    }
    /**
     * Create a new savings goal
     */
    async createGoal(userId, phoneNumber, goalData) {
        const startTime = performance.now();
        const goalId = `goal_${Date.now()}_${userId.substring(0, 8)}`;
        try {
            // Validate goal data
            if (!goalData.name || goalData.name.trim().length < 2) {
                throw new Error('Goal name must be at least 2 characters long.');
            }
            if (!goalData.targetAmountKes || goalData.targetAmountKes < 100) {
                throw new Error('Target amount must be at least KES 100.');
            }
            if (!goalData.targetDate || new Date(goalData.targetDate) <= new Date()) {
                throw new Error('Target date must be in the future.');
            }
            // Convert KES to BTC (simplified conversion)
            const btcRate = 6000000; // Example: 1 BTC = 6M KES
            const targetAmountBTC = goalData.targetAmountKes / btcRate;
            // Create goal object
            const goal = {
                id: goalId,
                userId,
                phoneNumber,
                name: goalData.name.trim(),
                description: goalData.description?.trim(),
                targetAmountKes: goalData.targetAmountKes,
                currentAmountKes: 0,
                targetAmountBTC,
                currentAmountBTC: 0,
                targetDate: new Date(goalData.targetDate),
                category: goalData.category || 'other',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                progressPercentage: 0,
                milestones: this.generateMilestones(goalId, goalData.targetAmountKes)
            };
            // Store goal
            this.goals.set(goalId, goal);
            // Create initial reminder
            await this.scheduleInitialReminder(goal);
            // Clear cache
            this.clearUserCache(userId);
            const responseTime = performance.now() - startTime;
            logger.info('Goal created successfully (TypeScript)', {
                goalId,
                userId,
                phoneNumber,
                name: goal.name,
                targetAmountKes: goal.targetAmountKes,
                targetDate: goal.targetDate,
                responseTime: Math.round(responseTime)
            });
            return {
                success: true,
                goal
            };
        }
        catch (error) {
            const responseTime = performance.now() - startTime;
            logger.error('Goal creation failed (TypeScript)', {
                userId,
                phoneNumber,
                error: error.message,
                responseTime: Math.round(responseTime)
            });
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Add contribution to a goal
     */
    async contributeToGoal(goalId, amountKes) {
        const startTime = performance.now();
        try {
            const goal = this.goals.get(goalId);
            if (!goal) {
                throw new Error('Goal not found');
            }
            if (!goal.isActive) {
                throw new Error('Goal is not active');
            }
            if (amountKes <= 0) {
                throw new Error('Contribution amount must be positive');
            }
            // Update goal amounts
            goal.currentAmountKes += amountKes;
            goal.currentAmountBTC += amountKes / 6000000; // Simplified conversion
            goal.updatedAt = new Date();
            // Calculate progress
            goal.progressPercentage = Math.min((goal.currentAmountKes / goal.targetAmountKes) * 100, 100);
            // Check if goal is completed
            if (goal.currentAmountKes >= goal.targetAmountKes) {
                goal.isActive = false;
                goal.completedAt = new Date();
                goal.progressPercentage = 100;
                // Schedule completion celebration
                await this.scheduleCompletionCelebration(goal);
            }
            // Check milestones
            await this.checkMilestones(goal);
            // Clear cache
            this.clearUserCache(goal.userId);
            const responseTime = performance.now() - startTime;
            logger.info('Goal contribution successful (TypeScript)', {
                goalId,
                amountKes,
                currentAmountKes: goal.currentAmountKes,
                progressPercentage: goal.progressPercentage,
                isCompleted: !goal.isActive,
                responseTime: Math.round(responseTime)
            });
            return {
                success: true,
                goal
            };
        }
        catch (error) {
            const responseTime = performance.now() - startTime;
            logger.error('Goal contribution failed (TypeScript)', {
                goalId,
                amountKes,
                error: error.message,
                responseTime: Math.round(responseTime)
            });
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Get user's goals
     */
    async getUserGoals(userId) {
        try {
            // Check cache first
            const cacheKey = `user_goals_${userId}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            // Filter goals by user ID
            const userGoals = [];
            for (const goal of this.goals.values()) {
                if (goal.userId === userId) {
                    userGoals.push(goal);
                }
            }
            // Sort by creation date (newest first)
            userGoals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            // Cache the result
            this.cache.set(cacheKey, userGoals);
            logger.debug('User goals retrieved (TypeScript)', {
                userId,
                goalCount: userGoals.length
            });
            return userGoals;
        }
        catch (error) {
            logger.error('Failed to get user goals (TypeScript)', {
                userId,
                error: error.message
            });
            return [];
        }
    }
    /**
     * Get goal statistics
     */
    getGoalStats() {
        const goals = Array.from(this.goals.values());
        const activeGoals = goals.filter(g => g.isActive);
        const completedGoals = goals.filter(g => !g.isActive);
        const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmountKes, 0);
        const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmountKes, 0);
        const averageProgress = goals.length > 0
            ? goals.reduce((sum, g) => sum + g.progressPercentage, 0) / goals.length
            : 0;
        return {
            totalGoals: goals.length,
            activeGoals: activeGoals.length,
            completedGoals: completedGoals.length,
            totalTargetAmount,
            totalCurrentAmount,
            averageProgress: Math.round(averageProgress * 100) / 100
        };
    }
    /**
     * Generate milestones for a goal
     */
    generateMilestones(goalId, targetAmount) {
        const milestones = [];
        const percentages = [25, 50, 75, 100];
        for (const percentage of percentages) {
            milestones.push({
                id: `milestone_${goalId}_${percentage}`,
                goalId,
                percentage,
                amountKes: (targetAmount * percentage) / 100,
                isReached: false
            });
        }
        return milestones;
    }
    /**
     * Check and update milestones
     */
    async checkMilestones(goal) {
        for (const milestone of goal.milestones) {
            if (!milestone.isReached && goal.currentAmountKes >= milestone.amountKes) {
                milestone.isReached = true;
                milestone.reachedAt = new Date();
                // Schedule milestone celebration
                await this.scheduleMilestoneCelebration(goal, milestone);
            }
        }
    }
    /**
     * Schedule initial reminder
     */
    async scheduleInitialReminder(goal) {
        const reminder = {
            id: `reminder_${goal.id}_initial`,
            goalId: goal.id,
            userId: goal.userId,
            phoneNumber: goal.phoneNumber,
            type: 'progress',
            message: `Great! Your goal "${goal.name}" has been created. Start saving towards your KES ${goal.targetAmountKes.toLocaleString()} target!`,
            scheduledAt: new Date(Date.now() + 60000), // 1 minute from now
            isProcessed: false
        };
        this.reminders.set(reminder.id, reminder);
        this.reminderQueue.push(reminder);
    }
    /**
     * Schedule completion celebration
     */
    async scheduleCompletionCelebration(goal) {
        const reminder = {
            id: `reminder_${goal.id}_completion`,
            goalId: goal.id,
            userId: goal.userId,
            phoneNumber: goal.phoneNumber,
            type: 'milestone',
            message: `🎉 Congratulations! You've completed your goal "${goal.name}"! You saved KES ${goal.targetAmountKes.toLocaleString()}!`,
            scheduledAt: new Date(),
            isProcessed: false
        };
        this.reminders.set(reminder.id, reminder);
        this.reminderQueue.push(reminder);
    }
    /**
     * Schedule milestone celebration
     */
    async scheduleMilestoneCelebration(goal, milestone) {
        const reminder = {
            id: `reminder_${goal.id}_milestone_${milestone.percentage}`,
            goalId: goal.id,
            userId: goal.userId,
            phoneNumber: goal.phoneNumber,
            type: 'milestone',
            message: `🎯 Amazing! You've reached ${milestone.percentage}% of your goal "${goal.name}"! Keep going!`,
            scheduledAt: new Date(),
            isProcessed: false
        };
        this.reminders.set(reminder.id, reminder);
        this.reminderQueue.push(reminder);
    }
    /**
     * Start reminder processor
     */
    startReminderProcessor() {
        setInterval(async () => {
            if (!this.isProcessing && this.reminderQueue.length > 0) {
                await this.processReminders();
            }
        }, 30000); // Process every 30 seconds
    }
    /**
     * Process pending reminders
     */
    async processReminders() {
        this.isProcessing = true;
        try {
            const now = new Date();
            const readyReminders = this.reminderQueue.filter(r => r.scheduledAt <= now && !r.isProcessed);
            for (const reminder of readyReminders) {
                try {
                    // Mark as processed
                    reminder.isProcessed = true;
                    reminder.processedAt = new Date();
                    // Remove from queue
                    const index = this.reminderQueue.indexOf(reminder);
                    if (index > -1) {
                        this.reminderQueue.splice(index, 1);
                    }
                    logger.info('Reminder processed (TypeScript)', {
                        reminderId: reminder.id,
                        goalId: reminder.goalId,
                        type: reminder.type,
                        phoneNumber: reminder.phoneNumber
                    });
                }
                catch (error) {
                    reminder.error = error.message;
                    logger.error('Reminder processing failed (TypeScript)', {
                        reminderId: reminder.id,
                        error: error.message
                    });
                }
            }
        }
        catch (error) {
            logger.error('Reminder processor failed (TypeScript)', {
                error: error.message
            });
        }
        finally {
            this.isProcessing = false;
        }
    }
    /**
     * Clear user cache
     */
    clearUserCache(userId) {
        const cacheKey = `user_goals_${userId}`;
        this.cache.delete(cacheKey);
    }
    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
        // Simple cache clearing for now
        this.cache.clear();
        logger.debug('Goal engine cache cleared (TypeScript)');
    }
}
// Export singleton instance
export const typedGoalEngine = new TypedGoalEngine();
export default typedGoalEngine;
//# sourceMappingURL=goalEngine.js.map