/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthUser, ActiveSession } from './types/auth.ts';
import { apiFetch, setCachedCsrfToken } from './lib/api.ts';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './components/HomePage.tsx';
import { LoginView } from './components/LoginView.tsx';
import { RegisterView } from './components/RegisterView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { SecuritySandbox } from './components/SecuritySandbox.tsx';
import { ForgotPasswordModal } from './components/ForgotPasswordModal.tsx';
import { ShieldCheck, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'login' | 'register' | 'dashboard' | 'sandbox'>('home');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Forgot Password Modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Demo Credentials Preset for Login Form
  const [demoLoginPreset, setDemoLoginPreset] = useState<{ identifier?: string; password?: string }>({});

  // Toast Notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Check existing session on mount
  useEffect(() => {
    checkCurrentSession();
  }, []);

  const checkCurrentSession = async () => {
    try {
      const data = await apiFetch('/api/auth/me');
      if (data.csrfToken) {
        setCachedCsrfToken(data.csrfToken);
      }
      if (data.authenticated && data.user) {
        setUser(data.user);
        setSession(data.session || null);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (err) {
      console.error('Session check failed:', err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleNavigate = (view: string) => {
    if (view === 'dashboard' && !user) {
      showToast('Authentication required. Please sign in to access the protected dashboard.', 'info');
      setCurrentView('login');
      return;
    }
    setCurrentView(view as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (authenticatedUser: AuthUser) => {
    setUser(authenticatedUser);
    checkCurrentSession();
    setCurrentView('dashboard');
    showToast(`Welcome back, ${authenticatedUser.full_name}! Secure session established.`, 'success');
  };

  const handleRegisterSuccess = (newUser: AuthUser) => {
    setUser(newUser);
    checkCurrentSession();
    setCurrentView('dashboard');
    showToast(`Account registered successfully with 12-round bcrypt hash!`, 'success');
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setSession(null);
      setCurrentView('home');
      showToast('Signed out successfully. Session invalidated.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Logout error', 'error');
    }
  };

  const fillDemoAndGoToLogin = () => {
    setDemoLoginPreset({
      identifier: 'securesmith',
      password: 'SecurePass#2026',
    });
    setCurrentView('login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050b14] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-18 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`px-4 py-3 rounded-xl border shadow-xl text-xs flex items-center gap-2.5 max-w-sm backdrop-blur-md ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : 'bg-cyan-950/90 border-cyan-500/40 text-cyan-200'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
            ) : (
              <Info size={16} className="text-cyan-400 shrink-0" />
            )}
            <span className="leading-snug">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {currentView === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onFillDemoCredentials={fillDemoAndGoToLogin}
          />
        )}

        {currentView === 'sandbox' && (
          <SecuritySandbox />
        )}

        {currentView === 'login' && (
          <LoginView
            onSuccess={handleLoginSuccess}
            onNavigateToRegister={() => setCurrentView('register')}
            onOpenForgotPassword={() => setIsForgotModalOpen(true)}
            presetIdentifier={demoLoginPreset.identifier || ''}
            presetPassword={demoLoginPreset.password || ''}
          />
        )}

        {currentView === 'register' && (
          <RegisterView
            onSuccess={handleRegisterSuccess}
            onNavigateToLogin={() => setCurrentView('login')}
          />
        )}

        {currentView === 'dashboard' && (
          user ? (
            <DashboardView
              user={user}
              session={session}
              onLogout={handleLogout}
              onRefreshUser={checkCurrentSession}
            />
          ) : (
            <div className="py-24 text-center">
              <p className="text-slate-400 text-sm">Protected route. Redirecting to authentication...</p>
            </div>
          )
        )}
      </main>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
