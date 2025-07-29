/**
 * Chama Module for Bitsacco WhatsApp Assistant
 * TypeScript version with enhanced type safety
 * Tracks group investments and participation
 * Following the exact design document specifications
 *
 * @author Bitsacco Engineering Team
 * @version 2.0.0 - TypeScript Migration
 */
interface ChamaData {
    name: string;
    description?: string;
    minContribution?: number;
    contributionFrequency?: 'weekly' | 'monthly';
    maxMembers?: number;
    targetAmount?: number;
    endDate?: string;
}
interface Chama {
    id: string;
    name: string;
    adminUserId: string;
    adminPhoneNumber: string;
    description: string;
    minContribution: number;
    contributionFrequency: 'weekly' | 'monthly';
    maxMembers: number;
    targetAmount?: number;
    currentAmount: number;
    memberCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    endDate?: Date;
    completedAt?: Date;
    members: ChamaMember[];
    rules: ChamaRules;
    stats: ChamaStats;
}
interface ChamaMember {
    userId: string;
    phoneNumber: string;
    firstName: string;
    lastName?: string;
    joinedAt: Date;
    isActive: boolean;
    totalContributions: number;
    contributionCount: number;
    lastContributionAt?: Date;
    role: 'admin' | 'member';
}
interface ChamaRules {
    latePaymentPenalty: number;
    missedPaymentLimit: number;
    withdrawalPolicy: 'consensus' | 'admin_only' | 'majority_vote';
    votingThreshold: number;
    autoKickInactive: boolean;
    inactivityPeriodDays: number;
}
interface ChamaStats {
    totalCollected: number;
    totalDisbursed: number;
    averageContribution: number;
    onTimePaymentRate: number;
    memberRetentionRate: number;
    contributionFrequencyCompliance: number;
}
interface ChamaContribution {
    id: string;
    chamaId: string;
    userId: string;
    phoneNumber: string;
    amount: number;
    contributionDate: Date;
    isLate: boolean;
    penalty?: number;
    transactionId?: string;
}
interface ChamaResult {
    success: boolean;
    chama?: Chama;
    error?: string;
}
interface ContributionResult {
    success: boolean;
    contribution?: ChamaContribution;
    chama?: Chama;
    error?: string;
}
declare class TypedChamaService {
    private chamaCache;
    private memberCache;
    private votingCache;
    private contributions;
    constructor();
    /**
     * Create a new chama group
     */
    createChama(adminUserId: string, adminPhoneNumber: string, chamaData: ChamaData): Promise<ChamaResult>;
    /**
     * Join an existing chama
     */
    joinChama(chamaId: string, userId: string, phoneNumber: string, firstName: string): Promise<ChamaResult>;
    /**
     * Make a contribution to chama
     */
    contributeToChama(chamaId: string, userId: string, amount: number): Promise<ContributionResult>;
    /**
     * Get user's chamas
     */
    getUserChamas(userId: string): Promise<Chama[]>;
    /**
     * Get chama details by ID
     */
    getChamaById(chamaId: string): Promise<Chama | null>;
    /**
     * Update chama statistics
     */
    private updateChamaStats;
    /**
     * Start cleanup intervals
     */
    private startCleanupIntervals;
    /**
     * Clean up inactive chamas
     */
    private cleanupInactiveChamas;
    /**
     * Clear expired cache entries
     */
    clearExpiredCache(): void;
    /**
     * Get service statistics
     */
    getStats(): any;
}
export declare const typedChamaService: TypedChamaService;
export default typedChamaService;
//# sourceMappingURL=chama.d.ts.map