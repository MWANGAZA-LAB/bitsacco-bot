/**
 * Bitsacco API Service Module for WhatsApp Assistant
 * TypeScript version with enhanced type safety
 * Handles integration with https://bitsacco.com/ backend API
 *
 * @author Bitsacco Engineering Team
 * @version 2.0.0 - TypeScript Migration
 *
 * Note: This is currently a placeholder service with mock implementations.
 * Replace mock logic with real HTTP requests to Bitsacco backend when available.
 */
interface OtpResponse {
    success: boolean;
    message: string;
    otpId?: string;
    expiresAt?: string;
}
interface VerifyOtpResponse {
    success: boolean;
    userId?: string;
    message: string;
    token?: string;
    profile?: UserProfile;
}
interface UserProfile {
    userId: string;
    phone: string;
    name?: string;
    email?: string;
    kycStatus: string;
    accountStatus: string;
    createdAt: string;
}
interface BalanceResponse {
    success: boolean;
    balance: number;
    currency: string;
    btcBalance?: number;
    usdBalance?: number;
    message?: string;
}
interface LoadMoneyResponse {
    success: boolean;
    message: string;
    transactionId?: string;
    paymentInstructions?: string;
    qrCode?: string;
    amount: number;
    currency: string;
}
interface WithdrawResponse {
    success: boolean;
    message: string;
    transactionId?: string;
    estimatedArrival?: string;
    fees?: number;
}
interface Transaction {
    transactionId: string;
    type: 'deposit' | 'withdrawal' | 'transfer' | 'bitcoin_purchase' | 'bitcoin_sale';
    amount: number;
    currency: string;
    btcAmount?: number;
    date: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    description?: string;
    fees?: number;
    destination?: string;
    source?: string;
}
interface TransactionHistoryResponse {
    success: boolean;
    transactions: Transaction[];
    totalCount: number;
    page: number;
    limit: number;
    message?: string;
}
interface PurchaseBitcoinResponse {
    success: boolean;
    message: string;
    transactionId?: string;
    btcAmount?: number;
    kesAmount: number;
    exchangeRate?: number;
    fees?: number;
}
interface WithdrawBitcoinResponse {
    success: boolean;
    message: string;
    transactionId?: string;
    btcAmount: number;
    kesAmount?: number;
    exchangeRate?: number;
    fees?: number;
}
declare class TypedBitsaccoApiService {
    private baseUrl;
    private apiKey;
    private timeout;
    private retryAttempts;
    private retryDelay;
    constructor();
    /**
     * Send OTP to user's phone number
     */
    sendOtp(phone: string): Promise<OtpResponse>;
    /**
     * Verify OTP for a phone number
     */
    verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse>;
    /**
     * Get Bitsacco account balance for a user
     */
    getBalance(userId: string): Promise<BalanceResponse>;
    /**
     * Initiate a load money (deposit) transaction
     */
    loadMoney(userId: string, amount: number, method?: string): Promise<LoadMoneyResponse>;
    /**
     * Initiate a withdrawal transaction
     */
    withdraw(userId: string, amount: number, destination: string, otp: string): Promise<WithdrawResponse>;
    /**
     * Purchase Bitcoin with KES
     */
    purchaseBitcoin(userId: string, kesAmount: number): Promise<PurchaseBitcoinResponse>;
    /**
     * Withdraw Bitcoin for KES
     */
    withdrawBitcoin(userId: string, btcAmount: number, otp: string): Promise<WithdrawBitcoinResponse>;
    /**
     * Get recent transaction history for a user
     */
    getTransactionHistory(userId: string, page?: number, limit?: number): Promise<TransactionHistoryResponse>;
    /**
     * Get user profile information
     */
    getUserProfile(userId: string): Promise<UserProfile | null>;
    /**
     * Make HTTP API call with retry logic
     */
    private makeApiCall;
    /**
     * Determine if error should trigger a retry
     */
    private shouldRetry;
    /**
     * Mask phone number for logging
     */
    private maskPhone;
    /**
     * Mask destination for logging
     */
    private maskDestination;
    private mockSendOtp;
    private mockVerifyOtp;
    private mockGetBalance;
    private mockLoadMoney;
    private mockWithdraw;
    private mockPurchaseBitcoin;
    private mockWithdrawBitcoin;
    private mockGetTransactionHistory;
    private mockGetUserProfile;
}
export declare const typedBitsaccoApiService: TypedBitsaccoApiService;
export default typedBitsaccoApiService;
//# sourceMappingURL=bitsaccoApi.d.ts.map