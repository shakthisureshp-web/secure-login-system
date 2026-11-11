import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';

const BCRYPT_SALT_ROUNDS = 12;

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  entropyScore: number; // 0 to 100
  isValid: boolean;
  errors: string[];
  feedback: {
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

export class SecurityService {
  // --- Password Hashing & Verification ---
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // --- Strict Validation ---
  validateEmail(email: string): boolean {
    if (!email || email.length > 254) return false;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(email.trim());
  }

  validateUsername(username: string): { isValid: boolean; error?: string } {
    if (!username || username.trim().length < 3) {
      return { isValid: false, error: 'Username must be at least 3 characters long.' };
    }
    if (username.length > 30) {
      return { isValid: false, error: 'Username cannot exceed 30 characters.' };
    }
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(username)) {
      return { isValid: false, error: 'Username may only contain letters, numbers, underscores, dashes, and periods.' };
    }
    return { isValid: true };
  }

  validateFullName(name: string): { isValid: boolean; error?: string } {
    if (!name || name.trim().length < 2) {
      return { isValid: false, error: 'Full name must be at least 2 characters long.' };
    }
    if (name.length > 80) {
      return { isValid: false, error: 'Full name cannot exceed 80 characters.' };
    }
    return { isValid: true };
  }

  evaluatePasswordStrength(password: string): PasswordStrengthResult {
    const errors: string[] = [];
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    if (!hasMinLength) errors.push('At least 8 characters required');
    if (!hasUppercase) errors.push('At least 1 uppercase letter required');
    if (!hasLowercase) errors.push('At least 1 lowercase letter required');
    if (!hasNumber) errors.push('At least 1 numerical digit required');
    if (!hasSpecialChar) errors.push('At least 1 special character required');

    let metRules = 0;
    if (hasMinLength) metRules++;
    if (hasUppercase) metRules++;
    if (hasLowercase) metRules++;
    if (hasNumber) metRules++;
    if (hasSpecialChar) metRules++;

    // Calculate approximate entropy score
    let poolSize = 0;
    if (hasLowercase) poolSize += 26;
    if (hasUppercase) poolSize += 26;
    if (hasNumber) poolSize += 10;
    if (hasSpecialChar) poolSize += 33;

    const entropy = poolSize > 0 ? Math.round(password.length * (Math.log2(poolSize))) : 0;
    const entropyScore = Math.min(100, Math.round((entropy / 80) * 100));

    let score = 0;
    if (metRules <= 2) score = 1;
    else if (metRules === 3) score = 2;
    else if (metRules === 4) score = 3;
    else if (metRules === 5 && password.length >= 10) score = 4;
    else score = 3;

    return {
      score,
      entropyScore,
      isValid: errors.length === 0,
      errors,
      feedback: {
        hasMinLength,
        hasUppercase,
        hasLowercase,
        hasNumber,
        hasSpecialChar,
      },
    };
  }

  // --- Cryptographic Identifiers & Tokens ---
  generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generateResetToken(): string {
    return crypto.randomBytes(24).toString('hex');
  }

  // --- Two-Factor Authentication (TOTP - RFC 6238) ---
  generateTwoFactorSecret(): string {
    return generateSecret();
  }

  getTwoFactorURI(secret: string, username: string): string {
    return generateURI({
      secret,
      label: username,
      issuer: 'SecureAuth',
    });
  }

  async generateQRCode(uri: string): Promise<string> {
    return QRCode.toDataURL(uri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      color: {
        dark: '#0284c7', // Cyber electric blue
        light: '#0a1120', // Dark navy background
      },
      width: 256,
    });
  }

  verifyTwoFactorCode(secret: string, token: string): boolean {
    try {
      const cleanToken = token.replace(/\s+/g, '');
      const result = verifySync({
        secret,
        token: cleanToken,
      });
      return result.valid === true;
    } catch {
      return false;
    }
  }

  // Temporary 2FA Challenge Token (signed with server secret)
  private hmacSecret = crypto.randomBytes(32).toString('hex');

  createTwoFactorChallenge(userId: number, username: string): string {
    const payload = JSON.stringify({
      userId,
      username,
      exp: Date.now() + 5 * 60 * 1000, // 5 minutes
    });
    const signature = crypto
      .createHmac('sha256', this.hmacSecret)
      .update(payload)
      .digest('hex');
    return Buffer.from(payload).toString('base64url') + '.' + signature;
  }

  verifyTwoFactorChallenge(token: string): { userId: number; username: string } | null {
    try {
      const [b64Payload, signature] = token.split('.');
      if (!b64Payload || !signature) return null;

      const payloadStr = Buffer.from(b64Payload, 'base64url').toString('utf8');
      const expectedSig = crypto
        .createHmac('sha256', this.hmacSecret)
        .update(payloadStr)
        .digest('hex');

      // Constant-time signature comparison to prevent timing attacks
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        return null;
      }

      const parsed = JSON.parse(payloadStr);
      if (Date.now() > parsed.exp) {
        return null;
      }

      return { userId: parsed.userId, username: parsed.username };
    } catch {
      return null;
    }
  }
}

export const securityService = new SecurityService();
