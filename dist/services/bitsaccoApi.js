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
import axios from 'axios';
import config from '../config/index.js';
import logger from '../utils/logger.js';
class TypedBitsaccoApiService {
    baseUrl;
    apiKey;
    timeout = 30000;
    retryAttempts = 3;
    retryDelay = 1000;
    constructor() {
        this.baseUrl = config.bitsacco?.apiUrl || 'https://api.bitsacco.com/v1';
        this.apiKey = config.bitsacco?.apiKey || '';
        if (!this.apiKey) {
            logger.warn('Bitsacco API key not configured - using mock responses (TypeScript)');
        }
        logger.info('Bitsacco API Service initialized (TypeScript)', {
            baseUrl: this.baseUrl,
            hasApiKey: Boolean(this.apiKey)
        });
    }
    /**
     * Send OTP to user's phone number
     */
    async sendOtp(phone) {
        try {
            logger.info('Sending OTP (TypeScript)', { phone: this.maskPhone(phone) });
            // Mock implementation - replace with real API call
            if (!this.apiKey) {
                return this.mockSendOtp(phone);
            }
            const response = await this.makeApiCall('POST', '/auth/send-otp', {
                phone: phone,
                purpose: 'whatsapp_verification'
            });
            logger.info('OTP sent successfully (TypeScript)', {
                phone: this.maskPhone(phone),
                otpId: response.data.otpId
            });
            return response.data;
        }
        catch (error) {
            logger.error('Failed to send OTP (TypeScript)', {
                phone: this.maskPhone(phone),
                error: error.message
            });
            return {
                success: false,
                message: 'Failed to send OTP. Please try again.'
            };
        }
    }
    /**
     * Verify OTP for a phone number
     */
    async verifyOtp(phone, otp) {
        try {
            logger.info('Verifying OTP (TypeScript)', {
                phone: this.maskPhone(phone),
                otpLength: otp.length
            });
            // Mock implementation - replace with real API call
            if (!this.apiKey) {
                return this.mockVerifyOtp(phone, otp);
            }
            const response = await this.makeApiCall('POST', '/auth/verify-otp', {
                phone: phone,
                otp: otp
            });
            logger.info('OTP verified successfully (TypeScript)', {
                phone: this.maskPhone(phone),
                userId: response.data.userId
            });
            return response.data;
        }
        catch (error) {
            logger.error('Failed to verify OTP (TypeScript)', {
                phone: this.maskPhone(phone),
                error: error.message
            });
            return {
                success: false,
                message: 'Invalid OTP. Please try again.'
            };
        }
    }
    /**
     * Get Bitsacco account balance for a user
     */
    async getBalance(userId) {
        try {
            logger.info('Fetching balance (TypeScript)', { userId });
            // Mock implementation - replace with real API call
            if (!this.apiKey) {
                return this.mockGetBalance(userId);
            }
            const response = await this.makeApiCall('GET', `/users/${userId}/balance`);
            logger.info('Balance fetched successfully (TypeScript)', {
                userId,
                balance: response.data.balance,
                currency: response.data.currency
            });
            return response.data;
        }
        catch (error) {
            logger.error('Failed to fetch balance (TypeScript)', {
                userId,
                error: error.message
            });
            return {
                success: false,
                balance: 0,
                currency: 'KES',
                message: 'Failed to fetch balance. Please try again.'
            };
        }
    }
    /**
     * Initiate a load money (deposit) transaction
     */
    async loadMoney(userId, amount, method = 'mpesa') {
        try {
            logger.info('Initiating deposit (TypeScript)', { userId, amount, method });
            // Mock implementation - replace with real API call
            if (!this.apiKey) {
                return this.mockLoadMoney(userId, amount, method);
            }
            const response = await this.makeApiCall('POST', `/users/${userId}/deposit`, {
                amount: amount,
                method: method,
                currency: 'KES'
            });
            logger.info('Deposit initiated successfully (TypeScript)', {
                userId,
                amount,
                method,
                transactionId: response.data.transactionId
            });
            return response.data;
        }
        catch (error) {
            logger.error('Failed to initiate deposit (TypeScript)', {
                userId,
                amount,
                method,
                error: error.message
            });
            return {
                success: false,
                message: 'Failed to initiate deposit. Please try again.',
                amount,
                currency: 'KES'
            };
        }
    }
    /**
     * Initiate a withdrawal transaction
     */
    async withdraw(userId, amount, destination, otp) {
        try {
            logger.info('Processing withdrawal (TypeScript)', {
                userId,
                amount,
                destination: this.maskDestination(destination)
            });
            // Mock implementation - replace with real API call
            if (!this.apiKey) {
                return this.mockWithdraw(userId, amount, destination, otp);
            }
            const response = await this.makeApiCall('POST', `/users/${userId}/withdraw`, {
                amount: amount,
                destination: destination,
                otp: otp,
                currency: 'KES'
            });
            logger.info('Withdrawal processed successfully (TypeScript)', {
                userId,
                amount,
                transactionId: response.data.transactionId
            });
            return response.data;
        }
        catch (error) {
            logger.error('Failed to process withdrawal (TypeScript)', {
                userId,
                amount,
                error: error.message
            });
            return {
                success: false,
                message: 'Failed to process withdrawal. Please check your OTP and try again.'
            };
        }
    }
    /**
     * Purchase Bitcoin with KES
     */
    async purchaseBitcoin(userId, kesAmount) {
        try {
            logger.info('Purchasing Bitcoin (TypeScript)', { userId, kesAmount });
            // Mock implementation - replace with real API call
            if (!this.apiKey) {
                return this.mockPurchaseBitcoin(userId, kesAmount);
            }
            const response = await this.makeApiCall('POST', `/users/${userId}/bitcoin/buy`, {
                amount: kesAmount,
                currency: 'KES'
            });
            logger.info('Bitcoin purchase successful (TypeScript)', {
                userId,
                kesAmount,
                btcAmount: response.data.btcAmount,
                transactionId: response.data.transactionId
            });
            return response.data;
        }
        catch (error) {
            logger.error('Failed to purchase Bitcoin (TypeScript)', {
                userId,
                kesAmount,
                error: error.message
            });
            return {
                success: false,
                message: 'Failed to purchase Bitcoin. Please try again.',
                kesAmount
            };
        }
    }
    /**
     * Withdraw Bitcoin for KES
     */
    async withdrawBitcoin(userId, btcAmount, otp) {
        try {
            logger.info('Withdrawing Bitcoin (TypeScript)', { userId, btcAmount });
            // Mock implementation - replace with real API call
            if (!this.apiKey) {
                return this.mockWithdrawBitcoin(userId, btcAmount, otp);
            }
            const response = await this.makeApiCall('POST', `/users/${userId}/bitcoin/withdraw`, {
                btcAmount: btcAmount,
                otp: otp
            });
            logger.info('Bitcoin sale successful (TypeScript)', {
                userId,
                btcAmount,
                kesAmount: response.data.kesAmount,
                transactionId: response.data.transactionId
            });
            return response.data;
        }
        catch (error) {
            logger.error('Failed to withdraw Bitcoin (TypeScript)', {
                userId,
                btcAmount,
                error: error.message
            });
            return {
                success: false,
                message: 'Failed to withdraw Bitcoin. Please check your OTP and try again.',
                btcAmount
            };
        }
    }
    /**
     * Get recent transaction history for a user
     */
    async getTransactionHistory(userId, page = 1, limit = 10) {
        try {
            logger.info('Fetching transaction history (TypeScript)', { userId, page, limit });
            // Mock implementation - replace with real API call
            if (!this.apiKey) {
                return this.mockGetTransactionHistory(userId, page, limit);
            }
            const response = await this.makeApiCall('GET', `/users/${userId}/transactions`, {
                page,
                limit
            });
            logger.info('Transaction history fetched successfully (TypeScript)', {
                userId,
                transactionCount: response.data.transactions.length,
                totalCount: response.data.totalCount
            });
            return response.data;
        }
        catch (error) {
            logger.error('Failed to fetch transaction history (TypeScript)', {
                userId,
                error: error.message
            });
            return {
                success: false,
                transactions: [],
                totalCount: 0,
                page,
                limit,
                message: 'Failed to fetch transaction history. Please try again.'
            };
        }
    }
    /**
     * Get user profile information
     */
    async getUserProfile(userId) {
        try {
            logger.info('Fetching user profile (TypeScript)', { userId });
            // Mock implementation - replace with real API call
            if (!this.apiKey) {
                return this.mockGetUserProfile(userId);
            }
            const response = await this.makeApiCall('GET', `/users/${userId}/profile`);
            if (response.data.success) {
                logger.info('User profile fetched successfully (TypeScript)', {
                    userId,
                    kycStatus: response.data.profile.kycStatus
                });
                return response.data.profile;
            }
            return null;
        }
        catch (error) {
            logger.error('Failed to fetch user profile (TypeScript)', {
                userId,
                error: error.message
            });
            return null;
        }
    }
    /**
     * Make HTTP API call with retry logic
     */
    async makeApiCall(method, endpoint, data, params) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Bitsacco-WhatsApp-Bot/1.0'
        };
        const config = {
            method,
            url,
            headers,
            timeout: this.timeout,
            data: method !== 'GET' ? data : undefined,
            params: method === 'GET' ? data : params
        };
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await axios(config);
                return response;
            }
            catch (error) {
                if (attempt === this.retryAttempts || !this.shouldRetry(error)) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
        throw new Error('Max retry attempts reached');
    }
    /**
     * Determine if error should trigger a retry
     */
    shouldRetry(error) {
        return (error.code === 'ECONNRESET' ||
            error.code === 'ETIMEDOUT' ||
            (error.response && error.response.status >= 500));
    }
    /**
     * Mask phone number for logging
     */
    maskPhone(phone) {
        if (phone.length <= 4)
            return phone;
        return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
    }
    /**
     * Mask destination for logging
     */
    maskDestination(destination) {
        if (destination.length <= 4)
            return destination;
        return `${destination.slice(0, 4)}****${destination.slice(-2)}`;
    }
    // Mock implementations (remove when real API is available)
    mockSendOtp(phone) {
        return {
            success: true,
            message: `OTP sent to ${this.maskPhone(phone)}`,
            otpId: `mock-otp-${Date.now()}`,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        };
    }
    mockVerifyOtp(phone, otp) {
        if (otp === '123456' || otp === '000000') {
            return {
                success: true,
                userId: `user-${phone.slice(-4)}`,
                message: 'OTP verified successfully',
                token: `mock-token-${Date.now()}`,
                profile: {
                    userId: `user-${phone.slice(-4)}`,
                    phone,
                    kycStatus: 'pending',
                    accountStatus: 'active',
                    createdAt: new Date().toISOString()
                }
            };
        }
        return { success: false, message: 'Invalid OTP' };
    }
    mockGetBalance(userId) {
        return {
            success: true,
            balance: 5000 + Math.floor(Math.random() * 10000),
            currency: 'KES',
            btcBalance: 0.001 + Math.random() * 0.01,
            usdBalance: 50 + Math.random() * 100
        };
    }
    mockLoadMoney(userId, amount, method) {
        return {
            success: true,
            message: `Deposit of KES ${amount} via ${method} initiated`,
            transactionId: `dep-${Date.now()}`,
            paymentInstructions: method === 'mpesa'
                ? 'Send to PayBill 123456, Account: your-phone-number'
                : 'Bank transfer instructions will be sent via SMS',
            amount,
            currency: 'KES'
        };
    }
    mockWithdraw(userId, amount, destination, otp) {
        if (otp === '654321' || otp === '000000') {
            return {
                success: true,
                message: `Withdrawal of KES ${amount} to ${this.maskDestination(destination)} successful`,
                transactionId: `wit-${Date.now()}`,
                estimatedArrival: '2-5 minutes',
                fees: amount * 0.01
            };
        }
        return { success: false, message: 'Invalid OTP for withdrawal' };
    }
    mockPurchaseBitcoin(userId, kesAmount) {
        const btcAmount = kesAmount / 8775000; // Mock BTC/KES rate
        const fees = kesAmount * 0.015; // 1.5% fee
        return {
            success: true,
            message: `Successfully purchased ₿${btcAmount.toFixed(8)} for KES ${kesAmount}`,
            transactionId: `btc-save-${Date.now()}`,
            btcAmount,
            kesAmount,
            exchangeRate: 8775000,
            fees
        };
    }
    mockWithdrawBitcoin(userId, btcAmount, otp) {
        if (otp === '654321' || otp === '000000') {
            const kesAmount = btcAmount * 8750000; // Mock BTC/KES rate (slightly lower for sell)
            const fees = kesAmount * 0.015; // 1.5% fee
            return {
                success: true,
                message: `Successfully sold ₿${btcAmount} for KES ${kesAmount.toFixed(2)}`,
                transactionId: `btc-withdraw-${Date.now()}`,
                btcAmount,
                kesAmount: kesAmount - fees,
                exchangeRate: 8750000,
                fees
            };
        }
        return { success: false, message: 'Invalid OTP for Bitcoin sale', btcAmount };
    }
    mockGetTransactionHistory(userId, page, limit) {
        const mockTransactions = [
            {
                transactionId: 'tx-001',
                type: 'deposit',
                amount: 2000,
                currency: 'KES',
                date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                status: 'completed',
                description: 'M-Pesa deposit',
                source: '254700123456'
            },
            {
                transactionId: 'tx-002',
                type: 'bitcoin_purchase',
                amount: 1500,
                currency: 'KES',
                btcAmount: 0.0001709,
                date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                status: 'completed',
                description: 'Bitcoin purchase',
                fees: 22.5
            },
            {
                transactionId: 'tx-003',
                type: 'deposit',
                amount: 4000,
                currency: 'KES',
                date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                status: 'pending',
                description: 'Bank transfer deposit',
                source: 'KCB Bank'
            }
        ];
        return {
            success: true,
            transactions: mockTransactions.slice((page - 1) * limit, page * limit),
            totalCount: mockTransactions.length,
            page,
            limit
        };
    }
    mockGetUserProfile(userId) {
        return {
            userId,
            phone: '+254700123456',
            name: 'John Doe',
            kycStatus: 'verified',
            accountStatus: 'active',
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        };
    }
}
// Export singleton instance
export const typedBitsaccoApiService = new TypedBitsaccoApiService();
export default typedBitsaccoApiService;
//# sourceMappingURL=bitsaccoApi.js.map