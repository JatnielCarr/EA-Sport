import crypto from 'crypto';
import { prisma } from '../config/database';

/**
 * Token Service — Manages Access Tokens and Refresh Tokens
 * 
 * Access Token: Short-lived JWT (15 minutes) — used for API requests
 * Refresh Token: Long-lived random token (7 days) — stored hashed in DB
 * 
 * Flow:
 * 1. User logs in → gets accessToken + refreshToken
 * 2. Access token expires → client calls /auth/refresh with refreshToken
 * 3. Server validates refreshToken, issues new accessToken
 * 4. User logs out → refreshToken is revoked in DB
 */

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Generate a cryptographically secure random refresh token
 */
export function generateRefreshTokenString(): string {
    return crypto.randomBytes(40).toString('hex');
}

/**
 * Hash a refresh token for secure storage
 */
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate and store a refresh token for a user
 * Returns the raw (unhashed) token to send to the client
 */
export async function createRefreshToken(userId: string): Promise<string> {
    const rawToken = generateRefreshTokenString();
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
        data: {
            token_hash: tokenHash,
            user_id: userId,
            expires_at: expiresAt,
        }
    });

    return rawToken;
}

/**
 * Verify a refresh token:
 * - Exists in DB
 * - Not revoked
 * - Not expired
 * Returns the userId if valid, null otherwise
 */
export async function verifyRefreshToken(rawToken: string): Promise<string | null> {
    const tokenHash = hashToken(rawToken);

    const storedToken = await prisma.refreshToken.findUnique({
        where: { token_hash: tokenHash }
    });

    if (!storedToken) return null;
    if (storedToken.revoked) return null;
    if (storedToken.expires_at < new Date()) {
        // Auto-cleanup expired token
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
        return null;
    }

    return storedToken.user_id;
}

/**
 * Revoke a specific refresh token (logout)
 */
export async function revokeRefreshToken(rawToken: string): Promise<boolean> {
    const tokenHash = hashToken(rawToken);

    try {
        await prisma.refreshToken.updateMany({
            where: { token_hash: tokenHash },
            data: { revoked: true }
        });
        return true;
    } catch {
        return false;
    }
}

/**
 * Revoke ALL refresh tokens for a user (force logout everywhere)
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
        where: { user_id: userId, revoked: false },
        data: { revoked: true }
    });
}

/**
 * Cleanup expired and revoked tokens (run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
        where: {
            OR: [
                { expires_at: { lt: new Date() } },
                { revoked: true }
            ]
        }
    });
    return result.count;
}
