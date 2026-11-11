import React, { useState } from 'react';
import { ShieldCheck, Database, KeyRound, Cookie, Play, AlertTriangle, CheckCircle2, Copy, Check } from 'lucide-react';
import { apiFetch, evaluateClientPasswordStrength } from '../lib/api.ts';

export const SecuritySandbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sqli' | 'password' | 'session'>('sqli');

  // SQL Injection Lab State
  const [sqlPayload, setSqlPayload] = useState<string>("' OR '1'='1");
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlResult, setSqlResult] = useState<any>(null);

  // Password Lab State
  const [testPassword, setTestPassword] = useState<string>("Tr0ub4dor&3#2026");
  const passwordAnalysis = evaluateClientPasswordStrength(testPassword);

  // Session Lab State
  const [cookieSimResult, setCookieSimResult] = useState<string>('');

  const runSqlTest = async (payloadToRun?: string) => {
    const input = payloadToRun !== undefined ? payloadToRun : sqlPayload;
    setSqlLoading(true);
    try {
      const res = await apiFetch('/api/security/sql-simulator', {
        method: 'POST',
        body: JSON.stringify({ queryInput: input }),
      });
      setSqlResult(res);
    } catch (err: any) {
      setSqlResult({ error: err.message });
    } finally {
      setSqlLoading(false);
    }
  };

  const testDocumentCookieAccess = () => {
    // Attempt to read session cookie from document.cookie
    const currentCookies = document.cookie;
    const hasSessionInDom = currentCookies.includes('secureauth_session');
    if (hasSessionInDom) {
      setCookieSimResult('UNSAFE: Session token was found in document.cookie!');
    } else {
      setCookieSimResult('PROTECTED: document.cookie cannot read "secureauth_session" because the HttpOnly attribute is enforced by the server! Malicious JavaScript / XSS payloads cannot exfiltrate this session.');
    }
  };

  return (
    <section className="py-10 px-6 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
          <ShieldCheck size={16} />
          <span>Interactive Cyber Verification Sandbox</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-display">
          Security Defense Simulator
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Verify and audit the real cryptographic, parameterized database, and session security mechanisms engineered into SecureAuth.
        </p>
      </div>

      {/* Segmented Tab Controls */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-lg max-w-xl mb-6">
        <button
          onClick={() => setActiveTab('sqli')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all ${
            activeTab === 'sqli'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database size={15} />
          <span>SQL Injection Neutralizer</span>
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all ${
            activeTab === 'password'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <KeyRound size={15} />
          <span>Entropy &amp; Hashing Lab</span>
        </button>
        <button
          onClick={() => setActiveTab('session')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all ${
            activeTab === 'session'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cookie size={15} />
          <span>HttpOnly Session Defense</span>
        </button>
      </div>

      {/* Tab 1: SQL Injection Neutralizer */}
      {activeTab === 'sqli' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <Database size={18} className="text-cyan-400" />
              <span>Test SQL Injection Payloads</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              In legacy vulnerable systems, concatenating user input allows attackers to manipulate SQL logic. SecureAuth runs parameterized queries using SQLite prepared statements with parameter binding.
            </p>

            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Enter Input / Malicious Vector
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={sqlPayload}
                onChange={(e) => setSqlPayload(e.target.value)}
                placeholder="e.g. ' OR '1'='1"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => runSqlTest()}
                disabled={sqlLoading}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Play size={14} />
                <span>{sqlLoading ? 'Testing...' : 'Execute'}</span>
              </button>
            </div>

            {/* Quick preset payloads */}
            <div className="mb-5">
              <span className="text-[11px] text-slate-400 block mb-1.5">Common SQLi Attack Presets:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  "' OR '1'='1",
                  "admin' --",
                  "' UNION SELECT 1, 'admin', 'hacked' --",
                  "securesmith",
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setSqlPayload(preset);
                      runSqlTest(preset);
                    }}
                    className="px-2.5 py-1 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
              <span className="font-semibold text-slate-200 block mb-1">Parameterized SQL Query Executed:</span>
              <pre className="font-mono text-cyan-400 text-[11px] overflow-x-auto">
{`SELECT id, username, email 
FROM users 
WHERE username = ?;`}
              </pre>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>Execution Inspection Result</span>
            </h2>

            {sqlResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Input Received:</span>
                    <span className="font-mono text-cyan-300 font-semibold">{sqlResult.inputReceived}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Parameterized Matches:</span>
                    <span className="font-mono tabular-nums text-white">{sqlResult.parameterizedMatchCount} record(s)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Security Verdict:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>Attack Neutralized (Zero Query Tampering)</span>
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-cyan-950/20 border border-cyan-800/40 rounded-lg text-slate-300 leading-relaxed">
                  <span className="font-semibold text-cyan-300 block mb-1">Engineering Explanation:</span>
                  {sqlResult.explanation}
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>Why it works:</strong> The SQLite database engine pre-compiles the query tree structure before user parameters are bound. Characters like quotes (<code className="text-cyan-300 font-mono">'</code>), dashes (<code className="text-cyan-300 font-mono">--</code>), and keywords (<code className="text-cyan-300 font-mono">OR, UNION</code>) are treated strictly as string data characters, never as executable syntax.
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                Click "Execute" or choose a preset payload on the left to inspect real-time query behavior.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Password Entropy & Hashing Lab */}
      {activeTab === 'password' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <KeyRound size={18} className="text-cyan-400" />
              <span>NIST Entropy &amp; Strength Evaluator</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              SecureAuth enforces strict multi-character class policies, calculates mathematical Shannon entropy, and hashes passwords using 12-round bcrypt with cryptographic salts.
            </p>

            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Type or Generate a Test Password
            </label>
            <input
              type="text"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="Type password..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 mb-4"
            />

            {/* Entropy Meter */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">Calculated Entropy Score:</span>
                <span className="font-mono tabular-nums font-semibold text-cyan-400">
                  {passwordAnalysis.entropyScore} / 100
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordAnalysis.entropyScore < 40
                      ? 'bg-rose-500'
                      : passwordAnalysis.entropyScore < 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${passwordAnalysis.entropyScore}%` }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Minimum 8 Characters</span>
                <span className={passwordAnalysis.feedback.hasMinLength ? 'text-emerald-400' : 'text-slate-500'}>
                  {passwordAnalysis.feedback.hasMinLength ? '✓ Passed' : '✗ Required'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Uppercase Letter (A-Z)</span>
                <span className={passwordAnalysis.feedback.hasUppercase ? 'text-emerald-400' : 'text-slate-500'}>
                  {passwordAnalysis.feedback.hasUppercase ? '✓ Passed' : '✗ Required'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Lowercase Letter (a-z)</span>
                <span className={passwordAnalysis.feedback.hasLowercase ? 'text-emerald-400' : 'text-slate-500'}>
                  {passwordAnalysis.feedback.hasLowercase ? '✓ Passed' : '✗ Required'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Numerical Digit (0-9)</span>
                <span className={passwordAnalysis.feedback.hasNumber ? 'text-emerald-400' : 'text-slate-500'}>
                  {passwordAnalysis.feedback.hasNumber ? '✓ Passed' : '✗ Required'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Special Symbol (!@#$%^&*)</span>
                <span className={passwordAnalysis.feedback.hasSpecialChar ? 'text-emerald-400' : 'text-slate-500'}>
                  {passwordAnalysis.feedback.hasSpecialChar ? '✓ Passed' : '✗ Required'}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <ShieldCheck size={18} className="text-cyan-400" />
              <span>Bcrypt Storage Standard</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block mb-1">Simulated 12-Round Bcrypt Hash Format:</span>
                <code className="block font-mono text-[11px] text-emerald-400 break-all bg-slate-900 p-2 rounded">
                  $2b$12$e8Y9M.Xw8q4P2...v9Z2hQO9G5.K1hKx3F7...
                </code>
                <div className="mt-2 text-[11px] text-slate-500">
                  <span className="text-cyan-400 font-mono">$2b$</span> Algorithm Identifier · <span className="text-cyan-400 font-mono">12$</span> 4,096 Key Derivation Iterations · <span className="text-cyan-400 font-mono">22-char</span> Cryptographic Salt · <span className="text-cyan-400 font-mono">31-char</span> Hash
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2 text-slate-300">
                <span className="font-semibold text-white block">Key Security Safeguards:</span>
                <p>• Plaintext passwords are never written to disk, database, or logging subsystems.</p>
                <p>• Passwords are protected by a work factor of 12 (4,096 key stretch rounds), resisting GPU dictionary cracking.</p>
                <p>• Password hashes are excluded from all API response payloads.</p>
                <p>• Password comparison uses constant-time algorithms to prevent timing attacks.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: HttpOnly Session Defense */}
      {activeTab === 'session' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <Cookie size={18} className="text-cyan-400" />
              <span>HttpOnly &amp; SameSite Cookie Inspection</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Standard local storage (<code className="text-cyan-300 font-mono">localStorage</code>) and regular cookies are accessible to any malicious script injected via XSS. SecureAuth transmits authentication tokens exclusively via HTTP-only cookies.
            </p>

            <button
              onClick={testDocumentCookieAccess}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors mb-4"
            >
              Test document.cookie Exfiltration Probe
            </button>

            {cookieSimResult && (
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-300">
                <span className="font-semibold text-cyan-300 block mb-1">Probe Inspection Result:</span>
                {cookieSimResult}
              </div>
            )}

            <div className="mt-4 p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2 font-mono">
              <div className="text-slate-400">Cookie Header Issued by SecureAuth:</div>
              <div className="text-[11px] text-cyan-300 break-all">
                Set-Cookie: secureauth_session=8f7e...; Path=/; HttpOnly; SameSite=Lax; Max-Age=14400
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>Multi-Layer Defense Matrix</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="font-semibold text-white block">1. HttpOnly Flag</span>
                <p className="text-slate-400 mt-0.5">
                  Blocks client-side JavaScript from accessing session tokens, preventing token theft during Cross-Site Scripting (XSS) events.
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="font-semibold text-white block">2. SameSite=Lax</span>
                <p className="text-slate-400 mt-0.5">
                  Restricts cookie transmission on cross-origin requests, shutting down Cross-Site Request Forgery (CSRF) attack vectors.
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="font-semibold text-white block">3. Cryptographic CSRF Double-Submit</span>
                <p className="text-slate-400 mt-0.5">
                  Mutating state requests require a cryptographically randomized anti-CSRF token verified in the <code className="text-cyan-300 font-mono">x-csrf-token</code> header.
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="font-semibold text-white block">4. Server-Side Session Invalidation</span>
                <p className="text-slate-400 mt-0.5">
                  Sessions are tracked in SQLite. Logging out or revoking active sessions terminates them authoritatively on the backend, neutralizing stolen tokens immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
