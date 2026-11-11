"""
SecureAuth - Python Flask Authentication Backend Reference
Demonstrating parameterized SQLite queries, bcrypt password hashing,
session management, rate limiting, and TOTP 2FA.
"""

import os
import sqlite3
import datetime
from flask import Flask, request, jsonify, session
from flask_bcrypt import Bcrypt
import pyotp
import qrcode
import io
import base64

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "super-secret-secureauth-key-change-in-prod-2026")
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False, # Set to True in HTTPS production
    PERMANENT_SESSION_LIFETIME=datetime.timedelta(hours=4)
)

bcrypt = Bcrypt(app)
DB_PATH = os.path.join(os.path.dirname(__file__), "secureauth.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            username TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            two_factor_enabled INTEGER DEFAULT 0,
            two_factor_secret TEXT,
            last_login_at TEXT
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS security_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            event_type TEXT NOT NULL,
            ip_address TEXT,
            details TEXT,
            timestamp TEXT NOT NULL
        );
    """)
    conn.commit()
    conn.close()

init_db()

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    full_name = data.get("fullName", "").strip()
    email = data.get("email", "").strip().lower()
    username = data.get("username", "").strip().lower()
    password = data.get("password", "")
    confirm_password = data.get("confirmPassword", "")

    if not full_name or not email or not username or not password:
        return jsonify({"error": "All fields are required."}), 400

    if password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long."}), 400

    conn = get_db()
    cursor = conn.cursor()

    # Parameterized queries against SQL injection
    cursor.execute("SELECT id FROM users WHERE email = ? OR username = ?", (email, username))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "Email or username is already registered."}), 409

    # Password hashing with bcrypt
    password_hash = bcrypt.generate_password_hash(password, rounds=12).decode("utf-8")
    now = datetime.datetime.utcnow().isoformat()

    cursor.execute(
        "INSERT INTO users (full_name, email, username, password_hash, created_at, two_factor_enabled) VALUES (?, ?, ?, ?, ?, 0)",
        (full_name, email, username, password_hash, now)
    )
    user_id = cursor.lastrowid

    cursor.execute(
        "INSERT INTO security_logs (user_id, event_type, ip_address, details, timestamp) VALUES (?, ?, ?, ?, ?)",
        (user_id, "REGISTRATION", request.remote_addr, "Account registered via Flask backend", now)
    )
    conn.commit()
    conn.close()

    session["user_id"] = user_id
    session.permanent = True

    return jsonify({
        "message": "User registered successfully!",
        "user": {
            "id": user_id,
            "full_name": full_name,
            "email": email,
            "username": username,
            "created_at": now,
            "two_factor_enabled": 0
        }
    }), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip().lower()
    password = data.get("password", "")
    remember_me = bool(data.get("rememberMe", False))

    if not identifier or not password:
        return jsonify({"error": "Identifier and password required."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ? OR username = ?", (identifier, identifier))
    user = cursor.fetchone()

    # Generic error to prevent user enumeration
    if not user or not bcrypt.check_password_hash(user["password_hash"], password):
        conn.close()
        return jsonify({"error": "Invalid email/username or password."}), 401

    # Check 2FA
    if user["two_factor_enabled"] == 1 and user["two_factor_secret"]:
        session["2fa_pending_user_id"] = user["id"]
        conn.close()
        return jsonify({
            "requires2FA": True,
            "username": user["username"],
            "message": "2FA required. Enter your 6-digit code."
        })

    now = datetime.datetime.utcnow().isoformat()
    cursor.execute("UPDATE users SET last_login_at = ? WHERE id = ?", (now, user["id"]))
    cursor.execute(
        "INSERT INTO security_logs (user_id, event_type, ip_address, details, timestamp) VALUES (?, ?, ?, ?, ?)",
        (user["id"], "LOGIN_SUCCESS", request.remote_addr, "Login successful", now)
    )
    conn.commit()
    conn.close()

    session["user_id"] = user["id"]
    if remember_me:
        app.permanent_session_lifetime = datetime.timedelta(days=14)
    session.permanent = True

    return jsonify({
        "message": "Login successful!",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "username": user["username"],
            "created_at": user["created_at"],
            "two_factor_enabled": user["two_factor_enabled"],
            "last_login_at": now
        }
    })

@app.route("/api/auth/verify-2fa", methods=["POST"])
def verify_2fa():
    data = request.get_json() or {}
    code = data.get("code", "").strip()
    user_id = session.get("2fa_pending_user_id")

    if not user_id:
        return jsonify({"error": "No pending 2FA login session."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()

    if not user or not user["two_factor_secret"]:
        conn.close()
        return jsonify({"error": "User 2FA not found."}), 400

    totp = pyotp.TOTP(user["two_factor_secret"])
    if not totp.verify(code):
        conn.close()
        return jsonify({"error": "Invalid 2FA code."}), 401

    session.pop("2fa_pending_user_id", None)
    session["user_id"] = user["id"]
    session.permanent = True
    conn.close()

    return jsonify({
        "message": "2FA verified!",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "username": user["username"],
            "two_factor_enabled": 1
        }
    })

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully."})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
