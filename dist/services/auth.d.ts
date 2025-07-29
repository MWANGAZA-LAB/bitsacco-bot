interface SessionData {
    sessionId: string;
    phoneNumber: string;
    userId?: string;
    createdAt: Date;
    expiresAt: Date;
    isActive: boolean;
    lastActivityAt: Date;
}
interface AuthResult {
    success: boolean;
    sessionId?: string;
    userId?: string;
    expiresAt?: Date;
    error?: string;
}
interface OTPResult {
    success: boolean;
    otpId?: string;
    expiresAt?: Date;
    error?: string;
}
declare class TypedAuthService {
    private otpStore;
    private sessionStore;
    private loginAttempts;
    constructor();
    /**
     * Generate and send OTP for phone number authentication
     */
    generateOTP(phoneNumber: string): Promise<OTPResult>;
    /**
     * Verify OTP and create session
     */
    verifyOTP(phoneNumber: string, otpCode: string): Promise<AuthResult>;
    /**
     * Validate session and return user data
     */
    validateSession(sessionId: string): Promise<SessionData | null>;
    /**
     * Cleanup expired sessions and OTPs
     */
    cleanupExpiredSessions(): Promise<void>;
    /**
     * Logout and invalidate session
     */
    logout(sessionId: string): Promise<boolean>;
    /**
     * Generate secure 6-digit OTP
     */
    private generateSecureOTP;
    /**
     * Generate secure session ID
     */
    private generateSessionId;
    /**
     * Validate phone number format
     */
    private isValidPhoneNumber;
    /**
     * Check rate limiting for phone number
     */
    private checkRateLimit;
    /**
     * Find OTP entry for phone number
     */
    private findOTPEntry;
    /**
     * Start cleanup intervals
     */
    private startCleanupIntervals;
    /**
     * Get service statistics
     */
    getStats(): any;
}
export declare const typedAuthService: TypedAuthService;
export default typedAuthService;
//# sourceMappingURL=auth.d.ts.map