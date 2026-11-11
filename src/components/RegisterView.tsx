import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, Mail, User, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { apiFetch, evaluateClientPasswordStrength } from '../lib/api.ts';
import { AuthUser } from '../types/auth.ts';

interface RegisterViewProps {
  onSuccess: (user: AuthUser) => void;
  onNavigateToLogin: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onSuccess, onNavigateToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const passwordAnalysis = evaluateClientPasswordStrength(password);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    const errors: { [key: string]: string } = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = 'Full Name must be at least 2 characters long.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!username.trim() || username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters long.';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      errors.username = 'Username can only contain letters, numbers, underscores, and dashes.';
    }

    if (!passwordAnalysis.isValid) {
      errors.password = 'Password does not meet the security policy requirements.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          username,
          password,
          confirmPassword,
        }),
      });

      if (response.user) {
        onSuccess(response.user);
      }
    } catch (err: any) {
      setServerError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-7 shadow-2xl backdrop-blur-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3">
            <Lock size={22} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">
            Create Secure Account
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Register with bcrypt-encrypted credential storage
          </p>
        </div>

        {serverError && (
          <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Mercer"
                className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors ${
                  fieldErrors.fullName ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                }`}
              />
              <User size={15} className="absolute left-3 top-3.5 text-slate-500" />
            </div>
            {fieldErrors.fullName && (
              <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors ${
                  fieldErrors.email ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                }`}
              />
              <Mail size={15} className="absolute left-3 top-3.5 text-slate-500" />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Username <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alex_mercer"
                className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors ${
                  fieldErrors.username ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                }`}
              />
              <Shield size={15} className="absolute left-3 top-3.5 text-slate-500" />
            </div>
            {fieldErrors.username && (
              <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.username}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full pl-9 pr-10 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors ${
                  fieldErrors.password ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                }`}
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

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="mt-2.5 p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Entropy Strength:</span>
                  <span className="font-mono font-semibold text-cyan-400">
                    {passwordAnalysis.entropyScore}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
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

                <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                  <div className={`flex items-center gap-1 ${passwordAnalysis.feedback.hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span>{passwordAnalysis.feedback.hasMinLength ? '✓' : '○'}</span>
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1 ${passwordAnalysis.feedback.hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span>{passwordAnalysis.feedback.hasUppercase ? '✓' : '○'}</span>
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1 ${passwordAnalysis.feedback.hasLowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span>{passwordAnalysis.feedback.hasLowercase ? '✓' : '○'}</span>
                    <span>Lowercase (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1 ${passwordAnalysis.feedback.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span>{passwordAnalysis.feedback.hasNumber ? '✓' : '○'}</span>
                    <span>Digit (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1 ${passwordAnalysis.feedback.hasSpecialChar ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span>{passwordAnalysis.feedback.hasSpecialChar ? '✓' : '○'}</span>
                    <span>Special (!@#$)</span>
                  </div>
                </div>
              </div>
            )}
            {fieldErrors.password && (
              <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Confirm Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full pl-9 pr-10 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors ${
                  fieldErrors.confirmPassword ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                }`}
              />
              <Lock size={15} className="absolute left-3 top-3.5 text-slate-500" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p className={`text-[11px] mt-1 ${passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
            {fieldErrors.confirmPassword && (
              <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-semibold text-xs rounded-lg shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Encrypting &amp; Registering...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <button
            onClick={onNavigateToLogin}
            className="text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Sign In here
          </button>
        </div>
      </div>
    </div>
  );
};
