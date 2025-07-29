import crypto from 'crypto';
import { performance } from 'perf_hooks';
import config from '../config/index.js';
import logger from '../utils/logger.js';
class TypedAuthService {
    otpStore = new Map();
    sessionStore = new Map();
    loginAttempts = new Map();
    constructor() {
        // Start cleanup intervals
        this.startCleanupIntervals();
    }
    /**
     * Generate and send OTP for phone number authentication
     */
    async generateOTP(phoneNumber) {
        const startTime = performance.now();
        try {
            // Validate phone number format
            if (!this.isValidPhoneNumber(phoneNumber)) {
                throw new Error('Invalid phone number format');
            }
            // Check rate limiting
            await this.checkRateLimit(phoneNumber);
            // Generate 6-digit OTP
            const otpCode = this.generateSecureOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            // Store OTP
            const otpData = {
                phoneNumber,
                otpCode,
                expiresAt,
                attempts: 0,
                maxAttempts: 3,
                createdAt: new Date()
            };
            const otpId = `otp_${phoneNumber}_${Date.now()}`;
            this.otpStore.set(otpId, otpData);
            // Log successful OTP generation
            const responseTime = performance.now() - startTime;
            logger.info('OTP generated successfully (TypeScript)', {
                phoneNumber,
                otpId,
                expiresAt,
                responseTime: Math.round(responseTime)
            });
            return {
                success: true,
                otpId,
                expiresAt
            };
        }
        catch (error) {
            const responseTime = performance.now() - startTime;
            logger.error('OTP generation failed (TypeScript)', {
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
     * Verify OTP and create session
     */
    async verifyOTP(phoneNumber, otpCode) {
        const startTime = performance.now();
        try {
            // Find OTP entry
            const otpEntry = this.findOTPEntry(phoneNumber);
            if (!otpEntry) {
                throw new Error('No OTP found for this phone number');
            }
            const [otpId, otpData] = otpEntry;
            // Check if OTP is expired
            if (new Date() > otpData.expiresAt) {
                this.otpStore.delete(otpId);
                throw new Error('OTP has expired');
            }
            // Check attempt limit
            if (otpData.attempts >= otpData.maxAttempts) {
                this.otpStore.delete(otpId);
                throw new Error('Maximum OTP attempts exceeded');
            }
            // Verify OTP code
            if (otpData.otpCode !== otpCode) {
                otpData.attempts++;
                throw new Error('Invalid OTP code');
            }
            // OTP verified successfully - create session
            const sessionId = this.generateSessionId();
            const expiresAt = new Date(Date.now() + config.security.sessionTimeout);
            const sessionData = {
                sessionId,
                phoneNumber,
                userId: `user_${phoneNumber}`, // Simplified user ID
                createdAt: new Date(),
                expiresAt,
                isActive: true,
                lastActivityAt: new Date()
            };
            this.sessionStore.set(sessionId, sessionData);
            // Clean up OTP
            this.otpStore.delete(otpId);
            // Reset login attempts
            this.loginAttempts.delete(phoneNumber);
            const responseTime = performance.now() - startTime;
            logger.info('OTP verified successfully (TypeScript)', {
                phoneNumber,
                sessionId,
                userId: sessionData.userId,
                expiresAt,
                responseTime: Math.round(responseTime)
            });
            return {
                success: true,
                sessionId,
                userId: sessionData.userId,
                expiresAt
            };
        }
        catch (error) {
            const responseTime = performance.now() - startTime;
            logger.error('OTP verification failed (TypeScript)', {
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
     * Validate session and return user data
     */
    async validateSession(sessionId) {
        try {
            const sessionData = this.sessionStore.get(sessionId);
            if (!sessionData) {
                return null;
            }
            // Check if session is expired
            if (new Date() > sessionData.expiresAt || !sessionData.isActive) {
                this.sessionStore.delete(sessionId);
                return null;
            }
            // Update last activity
            sessionData.lastActivityAt = new Date();
            logger.debug('Session validated (TypeScript)', {
                sessionId,
                phoneNumber: sessionData.phoneNumber,
                userId: sessionData.userId
            });
            return sessionData;
        }
        catch (error) {
            logger.error('Session validation failed (TypeScript)', {
                sessionId,
                error: error.message
            });
            return null;
        }
    }
    /**
     * Cleanup expired sessions and OTPs
     */
    async cleanupExpiredSessions() {
        try {
            const now = new Date();
            let expiredSessions = 0;
            let expiredOTPs = 0;
            // Clean up expired sessions
            for (const [sessionId, sessionData] of this.sessionStore) {
                if (now > sessionData.expiresAt) {
                    this.sessionStore.delete(sessionId);
                    expiredSessions++;
                }
            }
            // Clean up expired OTPs
            for (const [otpId, otpData] of this.otpStore) {
                if (now > otpData.expiresAt) {
                    this.otpStore.delete(otpId);
                    expiredOTPs++;
                }
            }
            // Clean up old login attempts
            for (const [phoneNumber, attempt] of this.loginAttempts) {
                if (attempt.lockedUntil && now > attempt.lockedUntil) {
                    this.loginAttempts.delete(phoneNumber);
                }
            }
            if (expiredSessions > 0 || expiredOTPs > 0) {
                logger.info('Cleanup completed (TypeScript)', {
                    expiredSessions,
                    expiredOTPs,
                    activeSessions: this.sessionStore.size,
                    activeOTPs: this.otpStore.size
                });
            }
        }
        catch (error) {
            logger.error('Cleanup failed (TypeScript)', {
                error: error.message
            });
        }
    }
    /**
     * Logout and invalidate session
     */
    async logout(sessionId) {
        try {
            const sessionData = this.sessionStore.get(sessionId);
            if (sessionData) {
                this.sessionStore.delete(sessionId);
                logger.info('User logged out (TypeScript)', {
                    sessionId,
                    phoneNumber: sessionData.phoneNumber,
                    userId: sessionData.userId
                });
                return true;
            }
            return false;
        }
        catch (error) {
            logger.error('Logout failed (TypeScript)', {
                sessionId,
                error: error.message
            });
            return false;
        }
    }
    /**
     * Generate secure 6-digit OTP
     */
    generateSecureOTP() {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < 6; i++) {
            const randomIndex = crypto.randomInt(0, digits.length);
            otp += digits[randomIndex];
        }
        return otp;
    }
    /**
     * Generate secure session ID
     */
    generateSessionId() {
        return `session_${crypto.randomBytes(16).toString('hex')}_${Date.now()}`;
    }
    /**
     * Validate phone number format
     */
    isValidPhoneNumber(phoneNumber) {
        // Basic phone number validation (can be enhanced)
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phoneNumber);
    }
    /**
     * Check rate limiting for phone number
     */
    async checkRateLimit(phoneNumber) {
        const attempt = this.loginAttempts.get(phoneNumber);
        const now = new Date();
        if (attempt) {
            // Check if still locked
            if (attempt.lockedUntil && now < attempt.lockedUntil) {
                const remainingTime = Math.ceil((attempt.lockedUntil.getTime() - now.getTime()) / 1000);
                throw new Error(`Too many attempts. Try again in ${remainingTime} seconds`);
            }
            // Reset if lockout period is over
            if (attempt.lockedUntil && now >= attempt.lockedUntil) {
                this.loginAttempts.delete(phoneNumber);
            }
        }
    }
    /**
     * Find OTP entry for phone number
     */
    findOTPEntry(phoneNumber) {
        for (const [otpId, otpData] of this.otpStore) {
            if (otpData.phoneNumber === phoneNumber) {
                return [otpId, otpData];
            }
        }
        return null;
    }
    /**
     * Start cleanup intervals
     */
    startCleanupIntervals() {
        // Clean up every 5 minutes
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 5 * 60 * 1000);
    }
    /**
     * Get service statistics
     */
    getStats() {
        return {
            activeSessions: this.sessionStore.size,
            activeOTPs: this.otpStore.size,
            loginAttempts: this.loginAttempts.size,
            timestamp: new Date().toISOString()
        };
    }
}
// Export singleton instance
export const typedAuthService = new TypedAuthService();
export default typedAuthService;
//# sourceMappingURL=auth.js.map