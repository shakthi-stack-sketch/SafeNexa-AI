import crypto from 'crypto';
import { AuthSessionPayload } from '../types';

const SESSION_SECRET = process.env.AUTH_SECRET || 'safenexa_enterprise_security_secret_key_2026_salt_token';
const SESSION_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Hashes a plaintext password using native Node.js scrypt with a unique random salt.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
}

/**
 * Verifies a plaintext password against a stored scrypt hash and salt using timing-safe comparison.
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const storedBuffer = Buffer.from(storedHash, 'hex');
    if (derivedKey.length !== storedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(derivedKey, storedBuffer);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * Creates a cryptographically signed session token using HMAC-SHA256.
 */
export function createSessionToken(payload: Omit<AuthSessionPayload, 'exp'>, rememberMe: boolean = true): string {
  const exp = Math.floor(Date.now() / 1000) + (rememberMe ? SESSION_EXPIRY_SECONDS : 60 * 60 * 24); // 7 days or 1 day
  const fullPayload: AuthSessionPayload = {
    ...payload,
    exp,
  };

  const payloadString = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadString)
    .digest('base64url');

  return `${payloadString}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 signed session token.
 * Returns the decoded session payload if valid and unexpired, or null otherwise.
 */
export function verifySessionToken(token: string): AuthSessionPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadString, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadString)
      .digest('base64url');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return null;
    }

    const jsonString = Buffer.from(payloadString, 'base64url').toString('utf8');
    const payload: AuthSessionPayload = JSON.parse(jsonString);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}
