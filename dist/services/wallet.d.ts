/**
 * Wallet Service Module for Bitsacco WhatsApp Assistant
 * TypeScript version with enhanced type safety
 * Interfaces with Bitsacco's Bitcoin wallet system
 * Following the exact design document specifications
 *
 * @author Bitsacco Engineering Team
 * @version 2.0.0 - TypeScript Migration
 */
interface WalletBalance {
    balanceBtc: number;
    balanceKes: number;
    balanceUsd: number;
    bitcoinPrice: {
        usd: number;
        kes: number;
        lastUpdated: string;
    };
    walletAddress?: string;
    lastUpdated: string;
}
interface BalanceResponse {
    success: boolean;
    data?: WalletBalance;
    source?: 'cache' | 'api';
    responseTime: number;
    message?: string;
}
interface PurchaseTransaction {
    transactionId: string;
    amountKes: number;
    amountBtc: number;
    rate: number;
    txHash?: string;
    status: 'pending' | 'completed' | 'failed';
    estimatedConfirmationTime?: string;
}
interface PurchaseResponse {
    success: boolean;
    data?: PurchaseTransaction;
    message?: string;
    transactionId?: string;
    responseTime: number;
}
interface TransferTransaction {
    transactionId: string;
    amountBtc: number;
    recipient: string;
    txHash?: string;
    status: 'pending' | 'completed' | 'failed';
    estimatedConfirmationTime?: string;
}
interface TransferResponse {
    success: boolean;
    data?: TransferTransaction;
    message?: string;
    transactionId?: string;
    responseTime: number;
}
interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out' | 'chama_contribution' | 'goal_savings';
    amountBtc: number;
    amountKes?: number;
    status: 'pending' | 'completed' | 'failed';
    date: string;
    description: string;
    confirmations?: number;
    txHash?: string;
}
interface TransactionHistoryData {
    transactions: Transaction[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}
interface TransactionHistoryResponse {
    success: boolean;
    data?: TransactionHistoryData;
    message?: string;
    responseTime: number;
}
interface WalletStats {
    cachedWallets: number;
    pendingTransactions: number;
    totalTransactions: number;
    timestamp: string;
}
declare class TypedWalletService {
    private walletCache;
    private transactionQueue;
    private cacheTimeout;
    private transactionTimeout;
    constructor();
    /**
     * Get user wallet balance (BTC and KES)
     */
    getBalance(userId: string, phoneNumber: string): Promise<BalanceResponse>;
    /**
     * Save Bitcoin with M-Pesa
     * Converts KES to Bitcoin for SACCO savings account
     */
    saveBitcoin(userId: string, phoneNumber: string, amountKes: number): Promise<PurchaseResponse>;
    /**
     * Get transaction history
     */
    getTransactionHistory(userId: string, phoneNumber: string, limit?: number, offset?: number): Promise<TransactionHistoryResponse>;
    /**
     * Transfer Bitcoin to another user
     */
    transferBitcoin(fromUserId: string, fromPhoneNumber: string, toPhoneNumber: string, amountBtc: number): Promise<TransferResponse>;
    /**
     * Get daily transaction limit based on user KYC level
     */
    getDailyLimit(userId: string): number;
    /**
     * Initiate M-Pesa payment
     */
    private initiateMpesaPayment;
    /**
     * Get transaction description for display
     */
    private getTransactionDescription;
    /**
     * Validate phone number format
     */
    private isValidPhoneNumber;
    /**
     * Mask phone number for privacy
     */
    private maskPhoneNumber;
    /**
     * Format BTC amount for display
     */
    formatBtcAmount(btcAmount: number): string;
    /**
     * Format KES amount for display
     */
    formatKesAmount(kesAmount: number): string;
    /**
     * Get wallet statistics
     */
    getStats(): WalletStats;
    /**
     * Clear expired cache entries
     */
    clearExpiredCache(): void;
}
export declare const typedWalletService: TypedWalletService;
export default typedWalletService;
//# sourceMappingURL=wallet.d.ts.map