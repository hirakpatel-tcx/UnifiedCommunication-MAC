import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  PhoneCall,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Sun,
  Moon,
  Radio,
} from 'lucide-react';
import { LoginCredentials, LoginResponse } from '../types/auth';
import { loginUser, saveAuthSession, getStoredBaseUrl, normalizeBaseUrl } from '../services/auth';

interface LoginScreenProps {
  onLoginSuccess: (response: LoginResponse, password?: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  theme,
  onToggleTheme,
}) => {
  const [email, setEmail] = useState<string>('root@tcx.com');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Status & Error handling
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const apiUrl = normalizeBaseUrl(getStoredBaseUrl());
      const creds: LoginCredentials = {
        email: email.trim(),
        password,
        baseUrl: apiUrl,
      };

      const response = await loginUser(creds);

      // Save session if rememberMe is enabled
      saveAuthSession(response, apiUrl, rememberMe ? password : undefined);

      // Notify parent app
      onLoginSuccess(response, password);
    } catch (err: any) {
      console.error('[LoginScreen] Login failed:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 overflow-hidden select-none px-4 py-8 transition-colors duration-200">
      {/* Background Decorative Ambient Blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-500/15 dark:bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/15 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-32 right-1/3 w-80 h-80 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar with macOS Window Drag & Theme Toggle */}
      <header className="titlebar-drag fixed top-0 inset-x-0 h-12 flex items-center justify-between px-4 z-30">
        <div className="pl-18 flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
            TCX Connect
          </span>
        </div>
        <div className="no-drag flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            type="button"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <div className="w-full max-w-md z-10 animate-popIn">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="relative inline-flex items-center justify-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-xl shadow-brand-600/25 ring-1 ring-white/20">
              <PhoneCall className="w-8 h-8 drop-shadow-md" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full ring-2 ring-white dark:ring-[#0B0F19]">
              <Radio className="w-3 h-3 animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            TCX Connect
          </h1>
        </div>

        {/* Form Container */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-3 p-3.5 mb-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email / Username Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email / Username
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="glass-input w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-medium focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="glass-input w-full pl-9 pr-10 py-2.5 rounded-xl text-sm font-medium focus:outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500/30 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Remember session & SIP password</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="tactile-btn w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 active:scale-[0.98] text-white font-semibold text-sm shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to PBX</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Feature Highlights Row */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>HIPAA Compliant</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-brand-500" />
            <span>TLS / SRTP</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-indigo-500" />
            <span>Noise Cancellation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
