import React, { useState } from 'react';
import { X, Mail, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../lib/api.ts';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [simulatedToken, setSimulatedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setMessage(res.message);
      if (res.simulatedResetToken) {
        setSimulatedToken(res.simulatedResetToken);
      }
    } catch (err: any) {
      setError(err.message || 'Request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Reset Account Password</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message ? (
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>

            {simulatedToken && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1 font-mono">
                <span className="text-slate-400 block text-[11px]">Simulated Cryptographic Recovery Token:</span>
                <span className="text-cyan-400 break-all">{simulatedToken}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Enter the email associated with your account. A time-limited, cryptographic reset token will be generated.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Account Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                />
                <Mail size={15} className="absolute left-3 top-3.5 text-slate-500" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Send Recovery Token'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
