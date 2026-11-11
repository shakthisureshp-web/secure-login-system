import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

const DB_FILE = path.resolve(process.cwd(), 'secureauth.db');

export interface UserRow {
  id: number;
  full_name: string;
  email: string;
  username: string;
  password_hash: string;
  created_at: string;
  two_factor_enabled: number;
  two_factor_secret: string | null;
  last_login_at: string | null;
  password_changed_at: string | null;
}

export interface SessionRow {
  id: string;
  user_id: number;
  created_at: string;
  expires_at: string;
  ip_address: string;
  user_agent: string;
  is_active: number;
}

export interface SecurityLogRow {
  id: number;
  user_id: number | null;
  event_type: string;
  ip_address: string;
  user_agent: string;
  details: string;
  timestamp: string;
}

export class DatabaseService {
  private db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(DB_FILE);
    this.initTables();
    this.seedDemoUser();
  }

  private initTables() {
    // Parameterized and relational schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        two_factor_enabled INTEGER DEFAULT 0,
        two_factor_secret TEXT,
        last_login_at TEXT,
        password_changed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS security_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        event_type TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        details TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS password_resets (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        used INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
    `);
  }

  private seedDemoUser() {
    // Check if demo user exists
    const checkStmt = this.db.prepare(`SELECT id FROM users WHERE username = ? OR email = ?`);
    const existing = checkStmt.get('securesmith', 'demo@secureauth.io') as { id: number } | undefined;

    if (!existing) {
      const saltRounds = 12;
      const demoHash = bcrypt.hashSync('SecurePass#2026', saltRounds);
      const now = new Date().toISOString();

      const insertStmt = this.db.prepare(`
        INSERT INTO users (full_name, email, username, password_hash, created_at, two_factor_enabled, last_login_at, password_changed_at)
        VALUES (?, ?, ?, ?, ?, 0, ?, ?)
      `);

      insertStmt.run(
        'Alex Mercer',
        'demo@secureauth.io',
        'securesmith',
        demoHash,
        now,
        now,
        now
      );

      this.logSecurityEvent(
        1,
        'SYSTEM_SEED',
        '127.0.0.1',
        'SecureAuth Kernel',
        'Initialized demonstration user account with 12-round bcrypt hash'
      );
    }
  }

  // --- User Operations (Parameterized Queries) ---
  findUserByEmailOrUsername(identifier: string): UserRow | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM users 
      WHERE email = ? OR username = ? 
      LIMIT 1
    `);
    return stmt.get(identifier, identifier) as UserRow | undefined;
  }

  findUserById(id: number): UserRow | undefined {
    const stmt = this.db.prepare(`SELECT * FROM users WHERE id = ? LIMIT 1`);
    return stmt.get(id) as UserRow | undefined;
  }

  findUserByEmail(email: string): UserRow | undefined {
    const stmt = this.db.prepare(`SELECT * FROM users WHERE email = ? LIMIT 1`);
    return stmt.get(email) as UserRow | undefined;
  }

  findUserByUsername(username: string): UserRow | undefined {
    const stmt = this.db.prepare(`SELECT * FROM users WHERE username = ? LIMIT 1`);
    return stmt.get(username) as UserRow | undefined;
  }

  createUser(fullName: string, email: string, username: string, passwordHash: string): number {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO users (full_name, email, username, password_hash, created_at, two_factor_enabled, password_changed_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `);
    const result = stmt.run(fullName, email, username, passwordHash, now, now);
    return Number(result.lastInsertRowid);
  }

  updateLastLogin(userId: number) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`UPDATE users SET last_login_at = ? WHERE id = ?`);
    stmt.run(now, userId);
  }

  updatePassword(userId: number, newHash: string) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`UPDATE users SET password_hash = ?, password_changed_at = ? WHERE id = ?`);
    stmt.run(newHash, now, userId);
  }

  setTwoFactorSecret(userId: number, secret: string) {
    const stmt = this.db.prepare(`UPDATE users SET two_factor_secret = ? WHERE id = ?`);
    stmt.run(secret, userId);
  }

  enableTwoFactor(userId: number, secret: string) {
    const stmt = this.db.prepare(`UPDATE users SET two_factor_enabled = 1, two_factor_secret = ? WHERE id = ?`);
    stmt.run(secret, userId);
  }

  disableTwoFactor(userId: number) {
    const stmt = this.db.prepare(`UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?`);
    stmt.run(userId);
  }

  // --- Session Operations ---
  createSession(sessionId: string, userId: number, expiresAt: string, ip: string, userAgent: string) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, user_id, created_at, expires_at, ip_address, user_agent, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    stmt.run(sessionId, userId, now, expiresAt, ip, userAgent);
  }

  findActiveSession(sessionId: string): (SessionRow & { user: UserRow }) | undefined {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      SELECT s.*, u.id as u_id, u.full_name, u.email, u.username, u.created_at as u_created_at,
             u.two_factor_enabled, u.last_login_at, u.password_changed_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.is_active = 1 AND s.expires_at > ?
      LIMIT 1
    `);
    const row = stmt.get(sessionId, now) as any;
    if (!row) return undefined;

    return {
      id: row.id,
      user_id: row.user_id,
      created_at: row.created_at,
      expires_at: row.expires_at,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      is_active: row.is_active,
      user: {
        id: row.u_id,
        full_name: row.full_name,
        email: row.email,
        username: row.username,
        password_hash: '', // Never expose password hash!
        created_at: row.u_created_at,
        two_factor_enabled: row.two_factor_enabled,
        two_factor_secret: null, // Don't expose secret in session lookups
        last_login_at: row.last_login_at,
        password_changed_at: row.password_changed_at,
      }
    };
  }

  revokeSession(sessionId: string) {
    const stmt = this.db.prepare(`UPDATE sessions SET is_active = 0 WHERE id = ?`);
    stmt.run(sessionId);
  }

  revokeAllOtherSessions(userId: number, currentSessionId: string) {
    const stmt = this.db.prepare(`UPDATE sessions SET is_active = 0 WHERE user_id = ? AND id != ?`);
    stmt.run(userId, currentSessionId);
  }

  // --- Security Audit Logs ---
  logSecurityEvent(userId: number | null, eventType: string, ip: string, userAgent: string, details: string) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO security_logs (user_id, event_type, ip_address, user_agent, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(userId, eventType, ip, userAgent, details, now);
  }

  getSecurityLogs(userId: number, limit = 20): SecurityLogRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM security_logs
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit) as unknown as SecurityLogRow[];
  }

  // --- Password Reset Simulation ---
  createPasswordResetToken(userId: number, token: string, expiresAt: string) {
    const stmt = this.db.prepare(`
      INSERT INTO password_resets (token, user_id, expires_at, used)
      VALUES (?, ?, ?, 0)
    `);
    stmt.run(token, userId, expiresAt);
  }

  findValidResetToken(token: string) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      SELECT * FROM password_resets
      WHERE token = ? AND used = 0 AND expires_at > ?
      LIMIT 1
    `);
    return stmt.get(token, now) as { token: string; user_id: number; expires_at: string; used: number } | undefined;
  }

  markResetTokenUsed(token: string) {
    const stmt = this.db.prepare(`UPDATE password_resets SET used = 1 WHERE token = ?`);
    stmt.run(token);
  }

  // --- SQL Injection Simulator Utility ---
  // Safely demonstrates how parameterized queries defend against injection
  testSqlInjection(queryInput: string) {
    // Parameterized test
    const parameterizedResult = this.db.prepare(
      `SELECT id, username, email FROM users WHERE username = ?`
    ).all(queryInput);

    // Unsafe string simulation (for demonstration in educational sandbox only, run in readonly or controlled mode)
    let unsafeQuery = `SELECT id, username, email FROM users WHERE username = '${queryInput}'`;
    let simulatedVulnerability = false;
    let explanation = '';

    if (
      queryInput.includes("' OR '") || 
      queryInput.includes("' OR 1=1") || 
      queryInput.includes("' OR '1'='1") ||
      queryInput.includes("--") ||
      queryInput.includes("/*")
    ) {
      simulatedVulnerability = true;
      explanation = "Input contains classic SQL injection bypass payload (' OR '1'='1). Parameterized queries treat this entire string strictly as literal data, neutralizing the malicious syntax completely!";
    } else {
      explanation = "Input was safely bound as a parameter constant. No alteration of query AST occurred.";
    }

    return {
      inputReceived: queryInput,
      parameterizedMatchCount: parameterizedResult.length,
      simulatedVulnerabilityDetected: simulatedVulnerability,
      defenseMechanism: "SQLite Prepared Statement with Typed Parameter Binding (Placeholder '?')",
      explanation,
    };
  }
}

export const dbService = new DatabaseService();
