import React from 'react';
import { ShieldLogo } from './ShieldLogo.tsx';
import { Shield, Lock, Terminal, FileCode2 } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#040812] text-slate-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Identity */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <ShieldLogo size={22} />
              <span className="text-base font-bold text-white tracking-tight">
                Secure<span className="text-cyan-400">Auth</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Hardened authentication platform built with SQLite parameterized statements, 12-round bcrypt hashing, and RFC 6238 TOTP 2FA.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-2">
            <p className="text-slate-200 font-semibold tracking-wide uppercase text-[11px]">System</p>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-cyan-400 transition-colors">
                  System Overview
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('sandbox')} className="hover:text-cyan-400 transition-colors">
                  Security Simulator Lab
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('login')} className="hover:text-cyan-400 transition-colors">
                  Authentication Portal
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('register')} className="hover:text-cyan-400 transition-colors">
                  Identity Registration
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Compliance & Standards */}
          <div className="space-y-2">
            <p className="text-slate-200 font-semibold tracking-wide uppercase text-[11px]">Standards Implemented</p>
            <ul className="space-y-1.5 text-slate-400">
              <li>NIST SP 800-63B Digital Identity</li>
              <li>OWASP Top 10 A01 &amp; A07 Protections</li>
              <li>RFC 6238 Time-Based OTP (TOTP)</li>
              <li>W3C SameSite &amp; HttpOnly Cookie RFC 6265bis</li>
            </ul>
          </div>

          {/* Col 4: Architecture */}
          <div className="space-y-2">
            <p className="text-slate-200 font-semibold tracking-wide uppercase text-[11px]">Runtime Defenses</p>
            <ul className="space-y-1.5 text-slate-400">
              <li>Prepared Statements (SQLi Proof)</li>
              <li>IP &amp; Velocity Brute Force Limiting</li>
              <li>Cryptographic CSRF Token Handshake</li>
              <li>Secure Audit Event Trail</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-slate-500">
          <p>© {new Date().getFullYear()} SecureAuth Platform. Engineered for resilient identity security.</p>
          <div className="flex items-center gap-3">
            <span>SQLite 3</span>
            <span aria-hidden="true">·</span>
            <span>Bcrypt 12-Rounds</span>
            <span aria-hidden="true">·</span>
            <span>TOTP 2FA</span>
            <span aria-hidden="true">·</span>
            <span>Express / Flask Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
