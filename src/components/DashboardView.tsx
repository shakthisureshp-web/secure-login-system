import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  LogOut,
  Clock,
  User,
  Mail,
  Shield,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Server,
  Layers,
} from 'lucide-react';
import { AuthUser, ActiveSession, SecurityLog } from '../types/auth.ts';
import { apiFetch, evaluateClientPasswordStrength } from '../lib/api.ts';
import { TwoFactorSetupModal } from './TwoFactorSetupModal.tsx';

interface DashboardViewProps {
  user: AuthUser;
  session: ActiveSession | null;
  onLogout: () => void;
  onRefreshUser: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  session,
  onLogout,
  onRefreshUser,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'audit'>('overview');
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // 2FA Setup Modal
  const [show2FAModal, setShow2FAModal] = useState(false);

  // 2FA Disable Modal State
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Revoke other sessions
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [revokeNotice, setRevokeNotice] = useState<string | null>(null);

  const newPwStrength = evaluateClientPasswordStrength(newPassword);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await apiFetch('/api/security/audit-logs');
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch security logs', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      setDisableError('Please enter your account password.');
      return;
    }
    setDisableLoading(true);
    setDisableError(null);
    try {
      await apiFetch('/api/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({
          password: disablePassword,
          code: disableCode,
        }),
      });
      setShowDisable2FA(false);
      setDisablePassword('');
      setDisableCode('');
      onRefreshUser();
    } catch (err: any) {
      setDisableError(err.message || 'Failed to disable 2FA.');
    } finally {
      setDisableLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);

    if (!currentPassword || !newPassword) {
      setPwMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPwMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (!newPwStrength.isValid) {
      setPwMessage({ type: 'error', text: 'New password does not satisfy security policy.' });
      return;
    }

    setPwLoading(true);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });
      setPwMessage({ type: 'success', text: res.message || 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      onRefreshUser();
    } catch (err: any) {
      setPwMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPwLoading(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setRevokingSessions(true);
    setRevokeNotice(null);
    try {
      const res = await apiFetch('/api/auth/revoke-other-sessions', { method: 'POST' });
      setRevokeNotice(res.message);
      setTimeout(() => setRevokeNotice(null), 4000);
    } catch (err: any) {
      setRevokeNotice(err.message || 'Failed to revoke other sessions.');
    } finally {
      setRevokingSessions(false);
    }
  };

  return (
    <div className="py-8 px-6 max-w-7xl mx-auto w-full">
      {/* Top Banner / Welcome Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src="/src/assets/images/avatar_security_officer_1794374836127.jpg"
              alt={user.full_name}
              className="w-16 h-16 rounded-xl object-cover border-2 border-cyan-500/40 shadow-lg"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" title="Active Protected Session" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
                Welcome back, {user.full_name}
              </h1>
              {user.two_factor_enabled === 1 && (
                <span className="text-[11px] font-mono text-cyan-400 border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 rounded">
                  2FA Active
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              <span>@{user.username}</span>
              <span aria-hidden="true">·</span>
              <span>ID: <span className="font-mono tabular-nums text-slate-300">#USR-{String(user.id).padStart(4, '0')}</span></span>
              <span aria-hidden="true">·</span>
              <span>Status: <span className="text-emerald-400 font-medium">Authenticated</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onLogout}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900/80 border border-slate-800 rounded-lg max-w-md mb-8">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
            activeTab === 'overview'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers size={14} />
          <span>Account Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
            activeTab === 'security'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield size={14} />
          <span>Security Center</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
            activeTab === 'audit'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History size={14} />
          <span>Audit Trail</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Account Details */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <User size={18} className="text-cyan-400" />
                <span>Identity &amp; Profile Metadata</span>
              </h2>
              <span className="text-xs text-slate-500 font-mono">SQLite Stored</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-500 block mb-1">FULL NAME</span>
                <span className="font-semibold text-slate-200">{user.full_name}</span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-500 block mb-1">USERNAME</span>
                <span className="font-mono text-cyan-300 font-medium">@{user.username}</span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-500 block mb-1">EMAIL ADDRESS</span>
                <span className="font-mono text-slate-200">{user.email}</span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-500 block mb-1">ACCOUNT CREATED</span>
                <span className="font-mono tabular-nums text-slate-300">
                  {new Date(user.created_at).toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-500 block mb-1">LAST LOGIN TIMESTAMP</span>
                <span className="font-mono tabular-nums text-slate-300">
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'First Session'}
                </span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-500 block mb-1">TWO-FACTOR AUTHENTICATION</span>
                <span className={user.two_factor_enabled === 1 ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                  {user.two_factor_enabled === 1 ? 'Enabled (TOTP RFC 6238)' : 'Disabled (Standard Password Only)'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-cyan-950/20 border border-cyan-900/40 rounded-lg text-xs text-slate-300 flex items-start gap-3">
              <ShieldCheck size={18} className="text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block mb-0.5">Zero Plaintext Policy</span>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Your password hash is never exposed to API endpoints or browser memory. Server-side queries strictly sanitize outbound identity payloads.
                </p>
              </div>
            </div>
          </div>

          {/* Active Session & Security Perimeter */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Server size={18} className="text-cyan-400" />
                <span>Current Session Perimeter</span>
              </h2>
              <span className="text-xs text-emerald-400 font-medium">HttpOnly Cookie</span>
            </div>

            {session ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">SESSION TOKEN:</span>
                    <span className="font-mono text-cyan-300">{session.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CLIENT IP:</span>
                    <span className="font-mono tabular-nums text-slate-300">{session.ipAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">EXPIRES AT:</span>
                    <span className="font-mono tabular-nums text-slate-300">
                      {new Date(session.expiresAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex flex-col pt-1">
                    <span className="text-slate-500 text-[10px]">USER AGENT:</span>
                    <span className="font-mono text-[11px] text-slate-400 truncate">
                      {session.userAgent}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 p-2.5 bg-slate-950/60 rounded border border-slate-800/80">
                    <span>HttpOnly Flag</span>
                    <span className="text-emerald-400 font-semibold">Active (XSS Immune)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300 p-2.5 bg-slate-950/60 rounded border border-slate-800/80">
                    <span>SameSite Policy</span>
                    <span className="text-emerald-400 font-semibold">Lax (CSRF Protected)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300 p-2.5 bg-slate-950/60 rounded border border-slate-800/80">
                    <span>SQL Injection Shield</span>
                    <span className="text-emerald-400 font-semibold">SQLite Prepared AST</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleRevokeOtherSessions}
                    disabled={revokingSessions}
                    className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                  >
                    {revokingSessions ? 'Revoking...' : 'Terminate All Other Active Sessions'}
                  </button>
                  {revokeNotice && (
                    <p className="text-[11px] text-emerald-400 text-center mt-1.5">{revokeNotice}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Session telemetry loading...
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY CENTER */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Two-Factor Authentication Card */}
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-cyan-400" />
                <h2 className="text-base font-semibold text-white">Two-Factor Authentication (2FA)</h2>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                user.two_factor_enabled === 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
              }`}>
                {user.two_factor_enabled === 1 ? 'Active' : 'Not Configured'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Two-factor authentication adds an extra cryptographic security layer by demanding a 6-digit verification code from your authenticator device during login.
            </p>

            {user.two_factor_enabled === 1 ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-xs text-emerald-300 flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <span className="font-semibold block">Authenticator App Linked</span>
                    <span className="text-emerald-400/80 text-[11px]">
                      Your account requires both your master password and your TOTP device code.
                    </span>
                  </div>
                </div>

                {showDisable2FA ? (
                  <form onSubmit={handleDisable2FA} className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                    <span className="text-xs font-semibold text-white block">Confirm 2FA Deactivation</span>
                    {disableError && (
                      <p className="text-[11px] text-rose-400">{disableError}</p>
                    )}
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Optional 6-digit Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={disableCode}
                        onChange={(e) => setDisableCode(e.target.value)}
                        placeholder="000000"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowDisable2FA(false)}
                        className="flex-1 py-1.5 text-xs text-slate-400 hover:text-white rounded bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={disableLoading}
                        className="flex-1 py-1.5 text-xs font-semibold text-rose-200 bg-rose-600 hover:bg-rose-500 rounded disabled:opacity-50"
                      >
                        {disableLoading ? 'Disabling...' : 'Confirm Disable'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowDisable2FA(true)}
                    className="px-4 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    Disable Two-Factor Authentication
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-950/20 border border-amber-800/40 rounded-lg text-xs text-amber-300 flex items-start gap-2.5">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-semibold block">2FA Recommended</span>
                    <span className="text-amber-400/80 text-[11px]">
                      Shield your account against credential stuffing and brute force breaches.
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShow2FAModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-semibold text-xs rounded-lg transition-all shadow-md shadow-cyan-500/20"
                >
                  Configure Authenticator App (QR Setup) →
                </button>
              </div>
            )}
          </div>

          {/* Change Password Card */}
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-cyan-400" />
                <h2 className="text-base font-semibold text-white">Update Password</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">12-Round Bcrypt</span>
            </div>

            {pwMessage && (
              <div className={`mb-4 p-3 rounded-lg text-xs flex items-start gap-2 ${
                pwMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {pwMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                <span>{pwMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    New Master Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />

                {newPassword.length > 0 && (
                  <div className="mt-2 p-2 bg-slate-950 border border-slate-800 rounded text-[11px]">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">Entropy Score:</span>
                      <span className="font-mono text-cyan-400 font-semibold">{newPwStrength.entropyScore}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${newPwStrength.entropyScore < 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${newPwStrength.entropyScore}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={pwLoading}
                className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                {pwLoading ? 'Re-hashing...' : 'Apply Password Change'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <History size={18} className="text-cyan-400" />
                <span>Security Event Audit Trail</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time forensic logs persisted in SQLite security_logs table
              </p>
            </div>
            <button
              onClick={fetchAuditLogs}
              disabled={loadingLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw size={12} className={loadingLogs ? 'animate-spin' : ''} />
              <span>Refresh Logs</span>
            </button>
          </div>

          {loadingLogs ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Querying database security logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No audit records recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Event Action</th>
                    <th className="py-2.5 px-3">Client IP</th>
                    <th className="py-2.5 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logs.map((log) => {
                    const isSuccess = log.event_type.includes('SUCCESS') || log.event_type === 'REGISTRATION' || log.event_type.includes('ENABLED');
                    const isAlert = log.event_type.includes('FAILED') || log.event_type.includes('BLOCKED');

                    return (
                      <tr key={log.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                            isSuccess
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isAlert
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {log.event_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-cyan-300 whitespace-nowrap">
                          {log.ip_address}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {log.details}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2FA Setup Modal */}
      <TwoFactorSetupModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        onSuccess={() => {
          onRefreshUser();
        }}
      />
    </div>
  );
};
