import { performance } from 'perf_hooks';
import logger from '../utils/logger.js';
class TypedChamaService {
    chamaCache = new Map();
    memberCache = new Map();
    votingCache = new Map();
    contributions = new Map();
    constructor() {
        // Initialize cleanup intervals
        this.startCleanupIntervals();
    }
    /**
     * Create a new chama group
     */
    async createChama(adminUserId, adminPhoneNumber, chamaData) {
        const startTime = performance.now();
        const chamaId = `chama_${Date.now()}_${adminUserId.substring(0, 8)}`;
        try {
            // Validate chama data
            if (!chamaData.name || chamaData.name.trim().length < 3) {
                throw new Error('Chama name must be at least 3 characters long.');
            }
            if (chamaData.minContribution && chamaData.minContribution < 100) {
                throw new Error('Minimum contribution must be at least KES 100.');
            }
            // Create default rules
            const defaultRules = {
                latePaymentPenalty: 50, // KES 50 penalty
                missedPaymentLimit: 3,
                withdrawalPolicy: 'majority_vote',
                votingThreshold: 60, // 60% needed for decisions
                autoKickInactive: true,
                inactivityPeriodDays: 90
            };
            // Create admin member
            const adminMember = {
                userId: adminUserId,
                phoneNumber: adminPhoneNumber,
                firstName: 'Admin', // Would normally come from user data
                joinedAt: new Date(),
                isActive: true,
                totalContributions: 0,
                contributionCount: 0,
                role: 'admin'
            };
            // Create chama object
            const newChama = {
                id: chamaId,
                name: chamaData.name.trim(),
                adminUserId,
                adminPhoneNumber,
                description: chamaData.description || '',
                minContribution: chamaData.minContribution || 1000,
                contributionFrequency: chamaData.contributionFrequency || 'monthly',
                maxMembers: chamaData.maxMembers || 20,
                targetAmount: chamaData.targetAmount || undefined,
                currentAmount: 0,
                memberCount: 1,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                endDate: chamaData.endDate ? new Date(chamaData.endDate) : undefined,
                members: [adminMember],
                rules: defaultRules,
                stats: {
                    totalCollected: 0,
                    totalDisbursed: 0,
                    averageContribution: 0,
                    onTimePaymentRate: 100,
                    memberRetentionRate: 100,
                    contributionFrequencyCompliance: 100
                }
            };
            // Store chama
            this.chamaCache.set(chamaId, newChama);
            this.memberCache.set(chamaId, [adminMember]);
            this.contributions.set(chamaId, []);
            const responseTime = performance.now() - startTime;
            logger.info('Chama created successfully (TypeScript)', {
                chamaId,
                name: newChama.name,
                adminUserId,
                adminPhoneNumber,
                minContribution: newChama.minContribution,
                contributionFrequency: newChama.contributionFrequency,
                responseTime: Math.round(responseTime)
            });
            return {
                success: true,
                chama: newChama
            };
        }
        catch (error) {
            const responseTime = performance.now() - startTime;
            logger.error('Chama creation failed (TypeScript)', {
                adminUserId,
                adminPhoneNumber,
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
     * Join an existing chama
     */
    async joinChama(chamaId, userId, phoneNumber, firstName) {
        const startTime = performance.now();
        try {
            const chama = this.chamaCache.get(chamaId);
            if (!chama) {
                throw new Error('Chama not found');
            }
            if (!chama.isActive) {
                throw new Error('Chama is not active');
            }
            if (chama.memberCount >= chama.maxMembers) {
                throw new Error('Chama is full');
            }
            // Check if user is already a member
            const existingMember = chama.members.find(m => m.userId === userId);
            if (existingMember) {
                throw new Error('User is already a member of this chama');
            }
            // Create new member
            const newMember = {
                userId,
                phoneNumber,
                firstName,
                joinedAt: new Date(),
                isActive: true,
                totalContributions: 0,
                contributionCount: 0,
                role: 'member'
            };
            // Add member to chama
            chama.members.push(newMember);
            chama.memberCount++;
            chama.updatedAt = new Date();
            // Update member cache
            const members = this.memberCache.get(chamaId) || [];
            members.push(newMember);
            this.memberCache.set(chamaId, members);
            const responseTime = performance.now() - startTime;
            logger.info('User joined chama successfully (TypeScript)', {
                chamaId,
                chamaName: chama.name,
                userId,
                phoneNumber,
                firstName,
                memberCount: chama.memberCount,
                responseTime: Math.round(responseTime)
            });
            return {
                success: true,
                chama
            };
        }
        catch (error) {
            const responseTime = performance.now() - startTime;
            logger.error('Chama join failed (TypeScript)', {
                chamaId,
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
     * Make a contribution to chama
     */
    async contributeToChama(chamaId, userId, amount) {
        const startTime = performance.now();
        try {
            const chama = this.chamaCache.get(chamaId);
            if (!chama) {
                throw new Error('Chama not found');
            }
            if (!chama.isActive) {
                throw new Error('Chama is not active');
            }
            // Find member
            const member = chama.members.find(m => m.userId === userId);
            if (!member || !member.isActive) {
                throw new Error('User is not an active member of this chama');
            }
            if (amount < chama.minContribution) {
                throw new Error(`Contribution must be at least KES ${chama.minContribution}`);
            }
            // Check if payment is late (simplified logic)
            const now = new Date();
            const isLate = member.lastContributionAt ?
                (now.getTime() - member.lastContributionAt.getTime()) > (32 * 24 * 60 * 60 * 1000) : // 32 days
                false;
            let penalty = 0;
            if (isLate && chama.rules.latePaymentPenalty > 0) {
                penalty = chama.rules.latePaymentPenalty;
            }
            // Create contribution record
            const contribution = {
                id: `contrib_${chamaId}_${userId}_${Date.now()}`,
                chamaId,
                userId,
                phoneNumber: member.phoneNumber,
                amount,
                contributionDate: now,
                isLate,
                penalty,
                transactionId: `tx_${Date.now()}`
            };
            // Update member stats
            member.totalContributions += amount;
            member.contributionCount++;
            member.lastContributionAt = now;
            // Update chama stats
            chama.currentAmount += amount;
            chama.updatedAt = now;
            // Update chama statistics
            this.updateChamaStats(chama);
            // Store contribution
            const chamaContributions = this.contributions.get(chamaId) || [];
            chamaContributions.push(contribution);
            this.contributions.set(chamaId, chamaContributions);
            // Check if chama target is reached
            if (chama.targetAmount && chama.currentAmount >= chama.targetAmount) {
                chama.completedAt = now;
                logger.info('Chama target reached (TypeScript)', {
                    chamaId,
                    chamaName: chama.name,
                    targetAmount: chama.targetAmount,
                    currentAmount: chama.currentAmount
                });
            }
            const responseTime = performance.now() - startTime;
            logger.info('Chama contribution successful (TypeScript)', {
                chamaId,
                chamaName: chama.name,
                userId,
                amount,
                penalty,
                isLate,
                currentAmount: chama.currentAmount,
                responseTime: Math.round(responseTime)
            });
            return {
                success: true,
                contribution,
                chama
            };
        }
        catch (error) {
            const responseTime = performance.now() - startTime;
            logger.error('Chama contribution failed (TypeScript)', {
                chamaId,
                userId,
                amount,
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
     * Get user's chamas
     */
    async getUserChamas(userId) {
        try {
            const userChamas = [];
            for (const chama of this.chamaCache.values()) {
                const isMember = chama.members.some(m => m.userId === userId && m.isActive);
                if (isMember) {
                    userChamas.push(chama);
                }
            }
            // Sort by creation date (newest first)
            userChamas.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            logger.debug('User chamas retrieved (TypeScript)', {
                userId,
                chamaCount: userChamas.length
            });
            return userChamas;
        }
        catch (error) {
            logger.error('Failed to get user chamas (TypeScript)', {
                userId,
                error: error.message
            });
            return [];
        }
    }
    /**
     * Get chama details by ID
     */
    async getChamaById(chamaId) {
        try {
            const chama = this.chamaCache.get(chamaId);
            if (chama) {
                logger.debug('Chama retrieved (TypeScript)', {
                    chamaId,
                    chamaName: chama.name,
                    memberCount: chama.memberCount,
                    currentAmount: chama.currentAmount
                });
            }
            return chama || null;
        }
        catch (error) {
            logger.error('Failed to get chama (TypeScript)', {
                chamaId,
                error: error.message
            });
            return null;
        }
    }
    /**
     * Update chama statistics
     */
    updateChamaStats(chama) {
        const contributions = this.contributions.get(chama.id) || [];
        if (contributions.length > 0) {
            // Calculate average contribution
            const totalAmount = contributions.reduce((sum, c) => sum + c.amount, 0);
            chama.stats.averageContribution = totalAmount / contributions.length;
            // Calculate on-time payment rate
            const onTimePayments = contributions.filter(c => !c.isLate).length;
            chama.stats.onTimePaymentRate = (onTimePayments / contributions.length) * 100;
            // Update total collected
            chama.stats.totalCollected = totalAmount;
        }
        // Update other stats as needed
        chama.stats.memberRetentionRate = (chama.members.filter(m => m.isActive).length / chama.members.length) * 100;
    }
    /**
     * Start cleanup intervals
     */
    startCleanupIntervals() {
        // Clean up inactive chamas every hour
        setInterval(() => {
            this.cleanupInactiveChamas();
        }, 60 * 60 * 1000);
    }
    /**
     * Clean up inactive chamas
     */
    cleanupInactiveChamas() {
        const now = new Date();
        let cleanedCount = 0;
        for (const [chamaId, chama] of this.chamaCache) {
            // Mark chama as inactive if end date is passed
            if (chama.endDate && now > chama.endDate && chama.isActive) {
                chama.isActive = false;
                chama.completedAt = now;
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            logger.info('Chama cleanup completed (TypeScript)', {
                cleanedCount,
                activeChamas: Array.from(this.chamaCache.values()).filter(c => c.isActive).length
            });
        }
    }
    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
        // Simple cache clearing for now
        this.memberCache.clear();
        this.votingCache.clear();
        logger.debug('Chama service cache cleared (TypeScript)');
    }
    /**
     * Get service statistics
     */
    getStats() {
        const chamas = Array.from(this.chamaCache.values());
        const activeChamas = chamas.filter(c => c.isActive);
        const totalMembers = chamas.reduce((sum, c) => sum + c.memberCount, 0);
        const totalAmount = chamas.reduce((sum, c) => sum + c.currentAmount, 0);
        return {
            totalChamas: chamas.length,
            activeChamas: activeChamas.length,
            totalMembers,
            totalAmount,
            averageMembersPerChama: chamas.length > 0 ? totalMembers / chamas.length : 0,
            timestamp: new Date().toISOString()
        };
    }
}
// Export singleton instance
export const typedChamaService = new TypedChamaService();
export default typedChamaService;
//# sourceMappingURL=chama.js.map