import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldAlert, ArrowRight, KeyRound, ShieldCheck, RefreshCw } from 'lucide-react';
import { apiFetch } from '../lib/api.ts';
import { AuthUser } from '../types/auth.ts';

interface LoginViewProps {
  onSuccess: (user: AuthUser) => void;
  onNavigateToRegister: () => void;
  onOpenForgotPassword: () => void;
  presetIdentifier?: string;
  presetPassword?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onSuccess,
  onNavigateToRegister,
  onOpenForgotPassword,
  presetIdentifier = '',
  presetPassword = '',
}) => {
  const [identifier, setIdentifier] = useState(presetIdentifier);
  const [password, setPassword] = useState(presetPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // 2FA Challenge State
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fillDemoCredentials = () => {
    setIdentifier('securesmith');
    setPassword('SecurePass#2026');
    setErrorMessage(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your identifier and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          rememberMe,
        }),
      });

      if (response.requires2FA) {
        setRequires2FA(true);
        setTempToken(response.tempToken);
        setErrorMessage(null);
      } else if (response.user) {
        onSuccess(response.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!totpCode.trim() || totpCode.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch('/api/auth/verify-2fa', {
        method: 'POST',
        body: JSON.stringify({
          tempToken,
          code: totpCode.trim(),
          rememberMe,
        }),
      });

      if (response.user) {
        onSuccess(response.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid 2FA code. Please check your authenticator.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-7 shadow-2xl backdrop-blur-sm">
        {requires2FA ? (
          /* Step 2: 2FA TOTP Code Screen */
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3">
                <ShieldCheck size={24} />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight font-display">
                Two-Factor Challenge
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-start gap-2">
                <ShieldAlert size={15} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 text-center">
                  Authenticator Security Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  className="w-full text-center tracking-[0.5em] px-4 py-3 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg text-2xl font-mono text-cyan-400 focus:outline-none"
                />
                <span className="block text-center text-[11px] text-slate-500 mt-1.5">
                  RFC 6238 Time-Synchronized OTP
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading || totpCode.length !== 6}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Verifying TOTP Token...</span>
                ) : (
                  <>
                    <span>Verify &amp; Authenticate</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setTempToken('');
                  setTotpCode('');
                  setErrorMessage(null);
                }}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Back to Login Credentials
              </button>
            </form>
          </div>
        ) : (
          /* Step 1: Standard Credentials Login */
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3">
                <Lock size={22} />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight font-display">
                Sign In to SecureAuth
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Protected by parameterized queries &amp; rate limiting
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-start gap-2">
                <ShieldAlert size={15} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quick Demo Fill Button */}
            <div className="mb-5 p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200 block">Demonstration Account</span>
                securesmith · SecurePass#2026
              </div>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="px-2.5 py-1 text-[11px] font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded transition-colors"
              >
                Auto-Fill
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="email@domain.com or username"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
                  />
                  <Mail size={15} className="absolute left-3 top-3.5 text-slate-500" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={onOpenForgotPassword}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
                  />
                  <Lock size={15} className="absolute left-3 top-3.5 text-slate-500" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span>Remember Me (14-day persistent session)</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-semibold text-xs rounded-lg shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Authenticate</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400">
              Don't have an account yet?{' '}
              <button
                onClick={onNavigateToRegister}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Register here
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
