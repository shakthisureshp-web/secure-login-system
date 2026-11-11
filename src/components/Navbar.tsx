import React from 'react';
import { ShieldLogo } from './ShieldLogo.tsx';
import { AuthUser } from '../types/auth.ts';
import { LogOut, LayoutDashboard, UserCheck } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: AuthUser | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  user,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070e1b]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single element Brand Zone */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <ShieldLogo size={30} className="transition-transform group-hover:scale-105" />
          <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 font-display">
            Secure<span className="text-cyan-400">Auth</span>
          </span>
        </button>

        {/* Zone 2: 4–5 single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate('home')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-cyan-400 ${
              currentView === 'home' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('sandbox')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-cyan-400 ${
              currentView === 'sandbox' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Security Lab
          </button>
          <a
            href="#features"
            onClick={(e) => {
              if (currentView !== 'home') {
                e.preventDefault();
                onNavigate('home');
                setTimeout(() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="transition-colors whitespace-nowrap shrink-0 hover:text-cyan-400"
          >
            Specifications
          </a>
          <a
            href="#architecture"
            onClick={(e) => {
              if (currentView !== 'home') {
                e.preventDefault();
                onNavigate('home');
                setTimeout(() => {
                  document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="transition-colors whitespace-nowrap shrink-0 hover:text-cyan-400"
          >
            Architecture
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors border ${
                  currentView === 'dashboard'
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40'
                    : 'text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                } whitespace-nowrap shrink-0`}
              >
                <LayoutDashboard size={14} />
                <span>Dashboard</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 rounded-md hover:bg-rose-500/10 transition-colors whitespace-nowrap shrink-0"
                title="Sign out of current session"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onNavigate('register')}
                className="hidden sm:inline-block px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Register
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 rounded-md shadow-sm shadow-cyan-500/20 transition-all whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
