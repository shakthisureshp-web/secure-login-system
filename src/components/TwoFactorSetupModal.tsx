import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Copy, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { apiFetch } from '../lib/api.ts';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSetupData();
    } else {
      setSecret('');
      setQrCode('');
      setVerificationCode('');
      setError(null);
    }
  }, [isOpen]);

  const loadSetupData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/auth/2fa/setup', { method: 'POST' });
      setSecret(data.secret);
      setQrCode(data.qrCode);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize 2FA setup.');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/api/auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({
          secret,
          code: verificationCode.trim(),
        }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Enable Two-Factor Authentication</h2>
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

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Generating cryptographic TOTP key and QR code...
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Scan this QR code with Google Authenticator, Microsoft Authenticator, Authy, or any RFC 6238-compatible app.
            </p>

            {/* QR Code Container */}
            <div className="flex justify-center p-3 bg-slate-950 border border-slate-800 rounded-xl">
              {qrCode ? (
                <img
                  src={qrCode}
                  alt="2FA QR Code"
                  className="w-48 h-48 rounded-lg shadow-inner"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-500">
                  QR unavailable
                </div>
              )}
            </div>

            {/* Manual Secret Key */}
            <div>
              <span className="block text-[11px] text-slate-400 mb-1">
                Or enter this secret key manually into your app:
              </span>
              <div className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-cyan-300 select-all">
                <span className="truncate flex-1 tracking-wider">{secret}</span>
                <button
                  type="button"
                  onClick={copySecret}
                  className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                  title="Copy secret"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Verification Code */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[0.4em] px-4 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg text-lg font-mono text-cyan-400 focus:outline-none"
              />
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
                disabled={submitting || verificationCode.length !== 6}
                className="flex-1 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? 'Verifying...' : 'Activate 2FA'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
