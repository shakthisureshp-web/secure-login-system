import React from 'react';
import { Shield, Lock, KeyRound, Database, Cpu, CheckCircle2, ArrowRight, Sparkles, Terminal } from 'lucide-react';
import { ShieldLogo } from './ShieldLogo.tsx';

interface HomePageProps {
  onNavigate: (view: string) => void;
  onFillDemoCredentials?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onFillDemoCredentials }) => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 tracking-wider uppercase">
              <Shield size={14} />
              <span>Enterprise Identity Infrastructure</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400 normal-case">SQLite &amp; Bcrypt Kernel</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-display">
              Your Security.<br />
              Your Identity.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                Our Priority.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              SecureAuth delivers an uncompromising authentication system engineered with parameterized SQLite prepared queries, 12-round bcrypt cryptographic password hashing, HTTP-only session isolation, and RFC 6238 TOTP two-factor authentication.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('register')}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-semibold text-sm rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
              >
                <span>Create Secure Account</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => onNavigate('login')}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg border border-slate-700/80 hover:border-cyan-500/50 transition-colors"
              >
                Sign In
              </button>

              <button
                onClick={() => onNavigate('sandbox')}
                className="px-5 py-3 text-slate-300 hover:text-cyan-300 font-medium text-sm flex items-center gap-1.5 transition-colors"
              >
                <Terminal size={15} />
                <span>Open Security Lab</span>
              </button>
            </div>

            {/* Quick Demo Credentials Box */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl max-w-lg mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound size={13} />
                  <span>Pre-Seeded Demonstration Account</span>
                </span>
                <span className="text-[11px] text-slate-400">Ready for Instant Evaluation</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block text-[10px]">USERNAME / EMAIL</span>
                  <span className="text-cyan-300 select-all">securesmith</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">PASSWORD</span>
                  <span className="text-cyan-300 select-all">SecurePass#2026</span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (onFillDemoCredentials) {
                    onFillDemoCredentials();
                  }
                  onNavigate('login');
                }}
                className="w-full mt-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded border border-cyan-500/30 transition-colors text-center"
              >
                Auto-Fill &amp; Sign In with Demo Account →
              </button>
            </div>
          </div>

          {/* Right Hero Column: High-Fidelity Cyber Vault Visual */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
              <img
                src="/src/assets/images/hero_cyber_vault_1794374835290.jpg"
                alt="SecureAuth Cyber Vault Architecture"
                className="w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050b14] via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-slate-950/80 backdrop-blur-md rounded-xl border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Cryptographic Vault Active</div>
                  <div className="text-[11px] text-slate-400">Zero-Trust Session Authentication</div>
                </div>
                <div className="font-mono text-cyan-400 text-[11px]">BCRYPT_R12</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features Grid */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
            <Shield size={14} />
            <span>Multi-Tier Defense Principles</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-display">
            Engineered Against Real-World Vectors
          </h2>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            Every layer from database queries to browser cookie transport adheres to OWASP Top 10 recommendations and NIST SP 800-63B standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-cyan-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <Database size={20} />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Parameterized SQL Queries</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              All database lookups use pre-compiled SQLite statements with strictly bound parameters, neutralizing all SQL injection vectors (e.g. <code className="text-cyan-300 font-mono">' OR '1'='1</code>).
            </p>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>Prepared Statements</span>
              <span aria-hidden="true">·</span>
              <span>Zero Concatenation</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-cyan-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <Lock size={20} />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">12-Round Bcrypt Hashing</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Passwords are salted and stretched using 4,096 iterations. Hashes are never exposed in responses or client state; plaintext is never stored or logged.
            </p>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>High Work Factor</span>
              <span aria-hidden="true">·</span>
              <span>Timing-Attack Immune</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-cyan-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <Cpu size={20} />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">RFC 6238 TOTP 2FA</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Optional Time-based One-Time Password support compatible with Google Authenticator, Microsoft Authenticator, and 1Password with live QR code onboarding.
            </p>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>30s Time-Step</span>
              <span aria-hidden="true">·</span>
              <span>HMAC-SHA1 Standard</span>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-cyan-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <Shield size={20} />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">HttpOnly &amp; SameSite Cookies</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Session identifiers are inaccessible to browser JavaScript, completely safeguarding tokens from malicious XSS injection scripts and cross-site requests.
            </p>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>No LocalStorage Leaks</span>
              <span aria-hidden="true">·</span>
              <span>SameSite=Lax</span>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-cyan-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <KeyRound size={20} />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Anti-Brute Force Rate Limiting</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Login attempts are throttled by IP velocity thresholds and account lock triggers, blocking high-speed credential stuffing and dictionary attacks.
            </p>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>15 Attempts / 15m</span>
              <span aria-hidden="true">·</span>
              <span>Automated Lockout</span>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-cyan-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <Terminal size={20} />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Immutable Security Audit Logs</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Every authentication attempt, registration, password update, and session revocation is recorded with client IP, user agent, and ISO timestamps.
            </p>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>Forensic Trail</span>
              <span aria-hidden="true">·</span>
              <span>Database Persisted</span>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Showcase Section */}
      <section id="architecture" className="py-16 bg-[#040914] border-t border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                <span>Cryptographic Token Handshake</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4 font-display">
                Zero-Trust Token &amp; 2FA Protocol
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                When a user registers or logs in, SecureAuth creates a cryptographically signed 256-bit session token stored in SQLite and dispatched via HttpOnly cookies. If two-factor authentication is active, the server demands a time-synchronized HMAC-SHA1 code before authorizing the session.
              </p>

              <div className="space-y-3 text-xs text-slate-300 mb-6">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span>Generic login feedback prevents account harvesting / timing attacks.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span>Double-submit cryptographic CSRF token protects all mutating endpoints.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span>Granular session revocation enables single-click remote sign-out.</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('sandbox')}
                className="px-5 py-2.5 bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <span>Launch Security Lab Simulator</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border border-slate-800">
                <img
                  src="/src/assets/images/feature_cryptography_shield_1794374835980.jpg"
                  alt="Cryptographic Defense Shield"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-800">
                <img
                  src="/src/assets/images/feature_auth_biometrics_1794374836523.jpg"
                  alt="Multi-Factor Authentication Matrix"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Strip */}
      <section className="py-16 text-center max-w-4xl mx-auto px-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 font-display">
          Experience Hardened Authentication
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Register a new account to test password strength analysis and 2FA pairing, or test with the pre-seeded demo user.
        </p>
        <div className="flex justify-center items-center gap-3">
          <button
            onClick={() => onNavigate('register')}
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
          >
            Register New Account
          </button>
          <button
            onClick={() => onNavigate('login')}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium text-xs rounded-lg transition-colors"
          >
            Access Login Portal
          </button>
        </div>
      </section>
    </div>
  );
};
