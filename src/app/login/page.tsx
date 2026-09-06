'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Flame, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const isRegistered = searchParams.get('registered') === 'true';
  const paramEmail = searchParams.get('email') || '';

  const { login, user } = useAuth();

  const [email, setEmail] = useState(paramEmail);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync email if paramEmail changes
  useEffect(() => {
    if (paramEmail) {
      setEmail(paramEmail);
    }
  }, [paramEmail]);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      router.push(redirectPath);
    }
  }, [user, router, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both work email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(email.trim(), password, rememberMe);

    if (result.success) {
      router.push(redirectPath);
      router.refresh();
    } else {
      setError(result.error || 'Authentication failed. Please verify your credentials.');
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Safenexa@2026');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none transition-colors">
      {/* Top Bar with Brand & Theme Switcher */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/35 flex items-center justify-center text-accent shadow-subtle">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-wider text-content-primary">SAFENEXA</span>
            <p className="text-[11px] text-content-muted font-medium">AI Safety & SIF Precursor Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div className="p-7 sm:p-8 rounded-2xl bg-bg-primary border border-border shadow-card space-y-6">
          {/* Header */}
          <div className="space-y-1 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-content-primary tracking-tight">
              Enterprise Sign In
            </h1>
            <p className="text-xs text-content-muted leading-relaxed">
              Access the operational HSE intelligence repository and automated SIF precursor engine.
            </p>
          </div>

          {/* Registration Success Banner */}
          {isRegistered && (
            <div className="p-3.5 rounded-xl bg-sif-low/15 border border-sif-low/30 flex items-start gap-2.5 text-xs text-sif-low font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Account created successfully. Please sign in with your credentials.</span>
            </div>
          )}

          {/* Error Message Toast */}
          {error && (
            <div className="p-3.5 rounded-xl bg-sif-high/15 border border-sif-high/30 flex items-start gap-2.5 text-xs text-sif-high">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Work Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-content-secondary uppercase tracking-wider text-[11px]">
                Corporate Work Email
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3.5 text-content-muted pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@safenexa.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-content-secondary uppercase tracking-wider text-[11px]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-accent hover:underline font-medium"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3.5 text-content-muted pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-content-muted hover:text-content-primary transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border bg-bg-secondary text-accent focus:ring-accent w-3.5 h-3.5"
                />
                <span className="text-xs text-content-secondary font-medium">Keep signed in for 7 days</span>
              </label>
            </div>

            {/* Sign In Button (High Contrast text on gold) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#14111A] border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Pre-configured Demo Accounts (Collapsible, cleanly separated) */}
          <details className="group pt-2 border-t border-border">
            <summary className="cursor-pointer text-[11px] font-medium text-content-muted hover:text-content-secondary text-center select-none list-none flex items-center justify-center gap-1.5 py-1 transition-colors">
              <span>Pre-configured Evaluation Accounts</span>
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180 text-content-muted" />
            </summary>
            <div className="pt-2 space-y-2">
              <p className="text-[10px] text-content-muted text-center leading-snug">
                Select an account to pre-fill test credentials for system review:
              </p>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleFillDemo('admin@safenexa.com')}
                  className="p-2 rounded-lg border border-border bg-bg-secondary hover:bg-bg-elevated text-content-secondary hover:text-content-primary font-medium text-center truncate transition-colors"
                >
                  Administrator
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo('manager@safenexa.com')}
                  className="p-2 rounded-lg border border-border bg-bg-secondary hover:bg-bg-elevated text-content-secondary hover:text-content-primary font-medium text-center truncate transition-colors"
                >
                  HSE Manager
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo('officer@safenexa.com')}
                  className="p-2 rounded-lg border border-border bg-bg-secondary hover:bg-bg-elevated text-content-secondary hover:text-content-primary font-medium text-center truncate transition-colors"
                >
                  HSE Officer
                </button>
              </div>
            </div>
          </details>

          {/* Create Account Link */}
          <div className="text-center pt-2">
            <p className="text-xs text-content-muted">
              Don&apos;t have an enterprise account?{' '}
              <Link href="/register" className="text-accent font-semibold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="max-w-7xl w-full mx-auto text-center py-2 text-[11px] text-content-muted">
        <span>SAFENEXA • Enterprise HSE Safety Intelligence & Barrier Governance</span>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center text-accent text-xs font-semibold tracking-wider">
          INITIALIZING SAFENEXA SECURE SESSION...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
