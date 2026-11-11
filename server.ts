import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { dbService } from './src/server/db.ts';
import { securityService } from './src/server/security.ts';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Body parsing and cookies
app.use(express.json());
app.use(cookieParser());

// Trust proxy for secure cookies and accurate client IP behind Cloud Run / Vite proxy
app.set('trust proxy', 1);

// Helpers
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'Unknown Client';
}

// Ensure CSRF cookie is set
app.use((req: Request, res: Response, next: NextFunction) => {
  let csrfToken = req.cookies['secureauth_csrf'];
  if (!csrfToken) {
    csrfToken = securityService.generateCsrfToken();
    res.cookie('secureauth_csrf', csrfToken, {
      httpOnly: false, // Accessible to client JavaScript to pass in x-csrf-token header
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
  req.csrfToken = csrfToken;
  next();
});

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      csrfToken?: string;
      authUser?: {
        id: number;
        full_name: string;
        email: string;
        username: string;
        created_at: string;
        two_factor_enabled: number;
        last_login_at: string | null;
        password_changed_at: string | null;
      };
      sessionId?: string;
    }
  }
}

// CSRF Protection Middleware for state-changing requests
const csrfProtect = (req: Request, res: Response, next: NextFunction) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const clientToken = req.headers['x-csrf-token'] as string;
  const cookieToken = req.cookies['secureauth_csrf'];

  // Check CSRF token
  if (!clientToken || !cookieToken || clientToken !== cookieToken) {
    return res.status(403).json({
      error: 'CSRF token validation failed. Please refresh and try again.',
      code: 'INVALID_CSRF_TOKEN',
    });
  }

  next();
};

// Rate limiter for login to prevent brute force
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per IP window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please wait 15 minutes before trying again.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  handler: (req, res, _next, options) => {
    dbService.logSecurityEvent(
      null,
      'RATE_LIMIT_BLOCKED',
      getClientIp(req),
      getUserAgent(req),
      'Exceeded maximum login velocity threshold (15 attempts/15min)'
    );
    res.status(429).json(options.message);
  },
});

// Session Auth Middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.cookies['secureauth_session'];
  if (!sessionId) {
    return res.status(401).json({ error: 'Authentication required. No active session found.' });
  }

  const activeSession = dbService.findActiveSession(sessionId);
  if (!activeSession) {
    res.clearCookie('secureauth_session');
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  req.authUser = activeSession.user;
  req.sessionId = activeSession.id;
  next();
};

// ==========================================
// API ROUTES
// ==========================================

// CSRF Token retrieval
app.get('/api/auth/csrf', (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken });
});

// Current User & Session status
app.get('/api/auth/me', (req: Request, res: Response) => {
  const sessionId = req.cookies['secureauth_session'];
  if (!sessionId) {
    return res.json({ authenticated: false, user: null, csrfToken: req.csrfToken });
  }

  const activeSession = dbService.findActiveSession(sessionId);
  if (!activeSession) {
    res.clearCookie('secureauth_session');
    return res.json({ authenticated: false, user: null, csrfToken: req.csrfToken });
  }

  res.json({
    authenticated: true,
    user: activeSession.user,
    session: {
      id: activeSession.id.slice(0, 8) + '...' + activeSession.id.slice(-6),
      createdAt: activeSession.created_at,
      expiresAt: activeSession.expires_at,
      ipAddress: activeSession.ip_address,
      userAgent: activeSession.user_agent,
    },
    csrfToken: req.csrfToken,
  });
});

// Register
app.post('/api/auth/register', csrfProtect, async (req: Request, res: Response) => {
  try {
    const { fullName, email, username, password, confirmPassword } = req.body;

    // Validate inputs
    const nameCheck = securityService.validateFullName(fullName);
    if (!nameCheck.isValid) {
      return res.status(400).json({ error: nameCheck.error });
    }

    if (!securityService.validateEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const usernameCheck = securityService.validateUsername(username);
    if (!usernameCheck.isValid) {
      return res.status(400).json({ error: usernameCheck.error });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const strength = securityService.evaluatePasswordStrength(password);
    if (!strength.isValid) {
      return res.status(400).json({
        error: 'Password does not meet security requirements: ' + strength.errors.join(', '),
        errors: strength.errors,
      });
    }

    // Check duplicate email (parameterized)
    const existingEmail = dbService.findUserByEmail(email.trim().toLowerCase());
    if (existingEmail) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    // Check duplicate username (parameterized)
    const existingUsername = dbService.findUserByUsername(username.trim().toLowerCase());
    if (existingUsername) {
      return res.status(409).json({ error: 'This username is already taken. Please choose another.' });
    }

    // Hash password with bcrypt 12 salt rounds
    const passwordHash = await securityService.hashPassword(password);

    // Create user in SQLite
    const userId = dbService.createUser(
      fullName.trim(),
      email.trim().toLowerCase(),
      username.trim().toLowerCase(),
      passwordHash
    );

    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Log security events
    dbService.logSecurityEvent(
      userId,
      'REGISTRATION',
      ip,
      userAgent,
      'New account registered with 12-round bcrypt hash'
    );

    // Auto-login session creation
    const sessionId = securityService.generateSessionId();
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(); // 4 hours
    dbService.createSession(sessionId, userId, expiresAt, ip, userAgent);
    dbService.updateLastLogin(userId);

    // Set HttpOnly session cookie
    res.cookie('secureauth_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: 4 * 60 * 60 * 1000,
    });

    const user = dbService.findUserById(userId);

    res.status(201).json({
      message: 'Account registered successfully!',
      user: {
        id: user!.id,
        full_name: user!.full_name,
        email: user!.email,
        username: user!.username,
        created_at: user!.created_at,
        two_factor_enabled: 0,
        last_login_at: user!.last_login_at,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'An unexpected server error occurred during registration.' });
  }
});

// Login
app.post('/api/auth/login', loginRateLimiter, csrfProtect, async (req: Request, res: Response) => {
  try {
    const { identifier, password, rememberMe } = req.body;
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please enter both your identifier and password.' });
    }

    // Parameterized lookup
    const user = dbService.findUserByEmailOrUsername(identifier.trim().toLowerCase());

    // Generic error to prevent username harvesting
    if (!user) {
      dbService.logSecurityEvent(
        null,
        'LOGIN_FAILED',
        ip,
        userAgent,
        `Failed login attempt for nonexistent identifier: [${identifier.slice(0, 3)}***]`
      );
      return res.status(401).json({ error: 'Invalid email/username or password.' });
    }

    // Verify bcrypt hash
    const isPasswordValid = await securityService.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      dbService.logSecurityEvent(
        user.id,
        'LOGIN_FAILED',
        ip,
        userAgent,
        'Incorrect password credential provided'
      );
      return res.status(401).json({ error: 'Invalid email/username or password.' });
    }

    // If Two-Factor Authentication is enabled
    if (user.two_factor_enabled === 1 && user.two_factor_secret) {
      const challengeToken = securityService.createTwoFactorChallenge(user.id, user.username);
      dbService.logSecurityEvent(
        user.id,
        '2FA_CHALLENGE_ISSUED',
        ip,
        userAgent,
        'Password verified. Prompting for 6-digit TOTP token'
      );

      return res.json({
        requires2FA: true,
        tempToken: challengeToken,
        username: user.username,
        message: 'Two-Factor Authentication is enabled. Please enter your 6-digit authenticator code.',
      });
    }

    // Session lifetime: 14 days if rememberMe, otherwise 4 hours
    const sessionDurationMs = rememberMe ? 14 * 24 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000;
    const sessionId = securityService.generateSessionId();
    const expiresAt = new Date(Date.now() + sessionDurationMs).toISOString();

    dbService.createSession(sessionId, user.id, expiresAt, ip, userAgent);
    dbService.updateLastLogin(user.id);
    dbService.logSecurityEvent(
      user.id,
      'LOGIN_SUCCESS',
      ip,
      userAgent,
      `Authenticated successfully via session token (${rememberMe ? 'Extended Remember Me' : 'Standard Session'})`
    );

    // Set HttpOnly Cookie
    res.cookie('secureauth_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: sessionDurationMs,
    });

    res.json({
      message: 'Login successful!',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        username: user.username,
        created_at: user.created_at,
        two_factor_enabled: user.two_factor_enabled,
        last_login_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An error occurred processing your login.' });
  }
});

// Verify 2FA Code during Login
app.post('/api/auth/verify-2fa', csrfProtect, async (req: Request, res: Response) => {
  try {
    const { tempToken, code, rememberMe } = req.body;
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    if (!tempToken || !code) {
      return res.status(400).json({ error: 'Authentication challenge token and verification code required.' });
    }

    const payload = securityService.verifyTwoFactorChallenge(tempToken);
    if (!payload) {
      return res.status(401).json({ error: '2FA challenge expired or invalid. Please sign in again.' });
    }

    const user = dbService.findUserById(payload.userId);
    if (!user || !user.two_factor_secret) {
      return res.status(400).json({ error: 'User 2FA configuration error.' });
    }

    const isValid = securityService.verifyTwoFactorCode(user.two_factor_secret, code);
    if (!isValid) {
      dbService.logSecurityEvent(
        user.id,
        '2FA_FAILED',
        ip,
        userAgent,
        'Invalid 6-digit TOTP code submitted'
      );
      return res.status(401).json({ error: 'Invalid 2FA code. Please check your authenticator app.' });
    }

    // 2FA Verified! Issue full session
    const sessionDurationMs = rememberMe ? 14 * 24 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000;
    const sessionId = securityService.generateSessionId();
    const expiresAt = new Date(Date.now() + sessionDurationMs).toISOString();

    dbService.createSession(sessionId, user.id, expiresAt, ip, userAgent);
    dbService.updateLastLogin(user.id);
    dbService.logSecurityEvent(
      user.id,
      '2FA_LOGIN_SUCCESS',
      ip,
      userAgent,
      'Full authentication completed with valid TOTP code'
    );

    res.cookie('secureauth_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: sessionDurationMs,
    });

    res.json({
      message: 'Two-factor authentication verified!',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        username: user.username,
        created_at: user.created_at,
        two_factor_enabled: user.two_factor_enabled,
        last_login_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('2FA verification error:', err);
    res.status(500).json({ error: 'An error occurred during 2FA verification.' });
  }
});

// Logout
app.post('/api/auth/logout', csrfProtect, (req: Request, res: Response) => {
  const sessionId = req.cookies['secureauth_session'];
  if (sessionId) {
    dbService.revokeSession(sessionId);
    dbService.logSecurityEvent(
      req.authUser ? req.authUser.id : null,
      'LOGOUT',
      getClientIp(req),
      getUserAgent(req),
      'User signed out. Session token invalidated.'
    );
  }

  res.clearCookie('secureauth_session', { path: '/' });
  res.json({ message: 'Signed out successfully.' });
});

// Setup 2FA - Generate Secret & QR Code
app.post('/api/auth/2fa/setup', requireAuth, csrfProtect, async (req: Request, res: Response) => {
  try {
    const user = req.authUser!;
    const secret = securityService.generateTwoFactorSecret();
    const uri = securityService.getTwoFactorURI(secret, user.username);
    const qrCode = await securityService.generateQRCode(uri);

    res.json({
      secret,
      qrCode,
      uri,
    });
  } catch (err: any) {
    console.error('2FA setup error:', err);
    res.status(500).json({ error: 'Failed to generate 2FA credentials.' });
  }
});

// Confirm & Enable 2FA
app.post('/api/auth/2fa/enable', requireAuth, csrfProtect, (req: Request, res: Response) => {
  try {
    const { secret, code } = req.body;
    const user = req.authUser!;

    if (!secret || !code) {
      return res.status(400).json({ error: 'Secret and verification code are required.' });
    }

    const isValid = securityService.verifyTwoFactorCode(secret, code);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code. Please confirm with your authenticator app.' });
    }

    dbService.enableTwoFactor(user.id, secret);
    dbService.logSecurityEvent(
      user.id,
      '2FA_ENABLED',
      getClientIp(req),
      getUserAgent(req),
      'Time-based One-Time Password (TOTP) 2FA successfully activated'
    );

    res.json({ message: 'Two-Factor Authentication is now enabled on your account!' });
  } catch (err: any) {
    console.error('Enable 2FA error:', err);
    res.status(500).json({ error: 'Failed to enable 2FA.' });
  }
});

// Disable 2FA
app.post('/api/auth/2fa/disable', requireAuth, csrfProtect, async (req: Request, res: Response) => {
  try {
    const { password, code } = req.body;
    const user = req.authUser!;

    if (!password) {
      return res.status(400).json({ error: 'Current password is required to disable 2FA.' });
    }

    const fullUser = dbService.findUserById(user.id);
    if (!fullUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isPasswordValid = await securityService.verifyPassword(password, fullUser.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Incorrect password provided.' });
    }

    // If code is supplied, verify it
    if (code && fullUser.two_factor_secret) {
      const isCodeValid = securityService.verifyTwoFactorCode(fullUser.two_factor_secret, code);
      if (!isCodeValid) {
        return res.status(400).json({ error: 'Invalid 2FA code.' });
      }
    }

    dbService.disableTwoFactor(user.id);
    dbService.logSecurityEvent(
      user.id,
      '2FA_DISABLED',
      getClientIp(req),
      getUserAgent(req),
      'Two-Factor Authentication was disabled'
    );

    res.json({ message: 'Two-Factor Authentication has been disabled.' });
  } catch (err: any) {
    console.error('Disable 2FA error:', err);
    res.status(500).json({ error: 'Failed to disable 2FA.' });
  }
});

// Change Password
app.post('/api/auth/change-password', requireAuth, csrfProtect, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const user = req.authUser!;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Please provide both your current and new password.' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }

    const fullUser = dbService.findUserById(user.id);
    if (!fullUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isCurrentValid = await securityService.verifyPassword(currentPassword, fullUser.password_hash);
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const strength = securityService.evaluatePasswordStrength(newPassword);
    if (!strength.isValid) {
      return res.status(400).json({
        error: 'New password does not meet security requirements: ' + strength.errors.join(', '),
      });
    }

    const newHash = await securityService.hashPassword(newPassword);
    dbService.updatePassword(user.id, newHash);

    dbService.logSecurityEvent(
      user.id,
      'PASSWORD_CHANGE',
      getClientIp(req),
      getUserAgent(req),
      'Account password changed successfully with 12-round bcrypt hash'
    );

    res.json({ message: 'Password updated successfully!' });
  } catch (err: any) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

// Invalidate all other sessions
app.post('/api/auth/revoke-other-sessions', requireAuth, csrfProtect, (req: Request, res: Response) => {
  try {
    const user = req.authUser!;
    const currentSessionId = req.sessionId!;

    dbService.revokeAllOtherSessions(user.id, currentSessionId);
    dbService.logSecurityEvent(
      user.id,
      'REVOKE_OTHER_SESSIONS',
      getClientIp(req),
      getUserAgent(req),
      'All other active browser sessions were revoked'
    );

    res.json({ message: 'All other active sessions have been terminated.' });
  } catch (err: any) {
    console.error('Revoke sessions error:', err);
    res.status(500).json({ error: 'Failed to revoke other sessions.' });
  }
});

// Security Audit Logs
app.get('/api/security/audit-logs', requireAuth, (req: Request, res: Response) => {
  const user = req.authUser!;
  const logs = dbService.getSecurityLogs(user.id, 25);
  res.json({ logs });
});

// Interactive SQL Injection Security Demonstration Sandbox
app.post('/api/security/sql-simulator', csrfProtect, (req: Request, res: Response) => {
  const { queryInput } = req.body;
  if (typeof queryInput !== 'string') {
    return res.status(400).json({ error: 'Query input string required.' });
  }

  const result = dbService.testSqlInjection(queryInput);
  res.json(result);
});

// Simulated Forgot Password Request
app.post('/api/auth/forgot-password', csrfProtect, (req: Request, res: Response) => {
  const { email } = req.body;
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);

  if (!email || !securityService.validateEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const user = dbService.findUserByEmail(email.trim().toLowerCase());
  if (user) {
    const token = securityService.generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    dbService.createPasswordResetToken(user.id, token, expiresAt);
    dbService.logSecurityEvent(
      user.id,
      'PASSWORD_RESET_REQUESTED',
      ip,
      userAgent,
      'Password recovery token generated (valid for 60 minutes)'
    );

    return res.json({
      message: 'If an account exists with this email, a password recovery link has been generated.',
      simulatedResetToken: token, // Exposed for test sandbox convenience
    });
  }

  // Consistent message to prevent email enumeration
  res.json({
    message: 'If an account exists with this email, a password recovery link has been generated.',
  });
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (isProd) {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SecureAuth] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SecureAuth] Fatal startup error:', err);
  process.exit(1);
});
