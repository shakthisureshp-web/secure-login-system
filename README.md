# SecureAuth – Secure Login & Authentication System

A production-grade, hardened authentication web application demonstrating end-to-end identity security, parameterized SQLite queries, 12-round bcrypt password hashing, HTTP-only session cookies, anti-brute force rate limiting, cryptographic CSRF tokens, and optional RFC 6238 TOTP Two-Factor Authentication (2FA).

---

## 1. Project Overview

**SecureAuth** is designed to demonstrate zero-trust web application security standards recommended by **OWASP Top 10** and **NIST SP 800-63B Digital Identity Guidelines**.

### Key Security Features
- **Zero Plaintext Password Storage**: Passwords are salted and stretched using **12-round bcrypt** (4,096 key-derivation iterations). Plaintext is never stored, logged, or transferred after hashing.
- **Full SQL Injection Immunity**: All database queries strictly utilize **parameterized SQLite prepared statements** with bound variables (`?`), disarming classic injection vectors such as `' OR '1'='1`.
- **HTTP-Only Session Management**: Session IDs are stored in `HttpOnly`, `SameSite=Lax` cookies, preventing client-side JavaScript / XSS scripts from accessing session tokens.
- **Two-Factor Authentication (TOTP - RFC 6238)**: Compatible with Google Authenticator, Microsoft Authenticator, and 1Password via dynamic QR code onboarding and 30-second time-step verification.
- **Login Rate Limiting**: Throttles failed attempts per IP window (15 attempts / 15 minutes) to protect against dictionary attacks and automated brute-force scripts.
- **Cryptographic CSRF Protection**: Double-submit cryptographic token handshake protects state-changing endpoints.
- **Forensic Security Audit Trail**: Database-persisted event log tracks registrations, successful logins, failed attempts, 2FA activations, and session revocations.
- **Interactive Security Simulator Lab**: Built-in verification sandbox allowing testers to execute live SQL injection payloads, measure password Shannon entropy, and test cookie boundaries.

---

## 2. Architecture & Tech Stack

### Frontend
- **Framework**: React 19 SPA with TypeScript
- **Styling**: Tailwind CSS (Dark Navy `#050b14`, Deep Blacks, Electric Blue `#00f0ff` accents)
- **Icons**: Lucide React
- **Design Philosophy**: Zero-pill discipline, tabular figures for security telemetry, high-contrast accessible typography (Plus Jakarta Sans & JetBrains Mono).

### Backend
1. **Node.js Express + SQLite (Primary Full-Stack Engine)**
   - Engine: Express 4 with Node 22 native `node:sqlite` (`DatabaseSync`)
   - Cryptography: `bcryptjs` (work factor 12), `crypto.randomBytes(32)`
   - TOTP & QR: `otplib` (RFC 6238 TOTP), `qrcode`
   - Protection: `express-rate-limit`, `cookie-parser`, custom CSRF middleware
2. **Python Flask Reference Backend (`/backend_flask/`)**
   - Available in `/backend_flask/app.py` with `Flask-Bcrypt`, `pyotp`, and `sqlite3` for Python environments.

---

## 3. Database Schema

The database (`secureauth.db`) contains four core tables:

### `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique user ID |
| `full_name` | TEXT | NOT NULL | User's full display name |
| `email` | TEXT | NOT NULL UNIQUE COLLATE NOCASE | Normalized email address |
| `username` | TEXT | NOT NULL UNIQUE COLLATE NOCASE | Unique username identifier |
| `password_hash` | TEXT | NOT NULL | 12-round bcrypt salt and hash |
| `created_at` | TEXT | NOT NULL | ISO-8601 registration timestamp |
| `two_factor_enabled` | INTEGER | DEFAULT 0 | 0 = Disabled, 1 = Enabled |
| `two_factor_secret` | TEXT | NULL | Base32 TOTP secret key |
| `last_login_at` | TEXT | NULL | Last successful login timestamp |
| `password_changed_at`| TEXT | NULL | Last password update timestamp |

### `sessions`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | 256-bit cryptographic hex session ID |
| `user_id` | INTEGER | NOT NULL, FK(users.id) | Referenced user |
| `created_at` | TEXT | NOT NULL | Session creation time |
| `expires_at` | TEXT | NOT NULL | Session expiration time |
| `ip_address` | TEXT | NULL | Client IP |
| `user_agent` | TEXT | NULL | Client browser signature |
| `is_active` | INTEGER | DEFAULT 1 | 1 = Active, 0 = Revoked |

### `security_logs`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique log ID |
| `user_id` | INTEGER | NULL | Targeted user ID (if identified) |
| `event_type` | TEXT | NOT NULL | E.g., `LOGIN_SUCCESS`, `2FA_ENABLED` |
| `ip_address` | TEXT | NULL | Request source IP |
| `user_agent` | TEXT | NULL | Request client agent |
| `details` | TEXT | NOT NULL | Security description |
| `timestamp` | TEXT | NOT NULL | ISO-8601 event timestamp |

### `password_resets`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `token` | TEXT | PRIMARY KEY | Time-limited recovery token |
| `user_id` | INTEGER | NOT NULL | Target user ID |
| `expires_at` | TEXT | NOT NULL | Expiration timestamp |
| `used` | INTEGER | DEFAULT 0 | Single-use flag |

---

## 4. Pre-Seeded Demonstration Account

The database seeds a demonstration account on first startup for immediate testing:

- **Username**: `securesmith`
- **Email**: `demo@secureauth.io`
- **Password**: `SecurePass#2026`
- **One-Click Quick Fill**: Available on both the Home Page and Login Screen.

---

## 5. Installation & Execution Guide

### Option A: Run Full-Stack Node.js + Express (Default)

1. **Clone or navigate to the project directory**:
   ```bash
   cd secureauth
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:3000` with the SQLite database initialized automatically.*

4. **Production Build & Launch**:
   ```bash
   npm run build
   npm start
   ```

---

### Option B: Run Python Flask Reference Backend

1. **Navigate to the Flask directory**:
   ```bash
   cd backend_flask
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Launch the Flask application**:
   ```bash
   python app.py
   ```
   *The Flask API will run on `http://localhost:5000`.*

---

## 6. Security Defenses Tested & Verified

1. **SQL Injection Defense**:
   - Parameterized queries ensure that inputs like `' OR '1'='1` are treated as literal strings and cannot escape into the SQL parser syntax.
2. **Timing Attack Protection**:
   - Bcrypt comparison and HMAC verification execute in constant-time to prevent side-channel timing analysis.
3. **User Enumeration Prevention**:
   - Authentication errors return generic messaging (*"Invalid email/username or password"*) regardless of whether the identifier exists.
4. **Session Token Exfiltration Prevention**:
   - Session identifiers are never exposed via JavaScript `document.cookie` or `localStorage`.

---

## 7. License

Licensed under the Apache License, Version 2.0.
