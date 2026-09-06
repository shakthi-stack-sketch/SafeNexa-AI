'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Flame, Mail, ArrowLeft, Send, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid work email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessInfo(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessInfo(data.message);
      } else {
        setError(data.error || 'No active enterprise account found matching this email address.');
      }
    } catch {
      setError('Network communication error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none transition-colors">
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

        <ThemeToggle />
      </header>

      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div className="p-7 sm:p-8 rounded-2xl bg-bg-primary border border-border shadow-card space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-content-primary tracking-tight">
              Password Recovery
            </h1>
            <p className="text-xs text-content-muted leading-relaxed">
              Verify your authorized enterprise email to initiate credential reset protocols.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-sif-high/15 border border-sif-high/30 flex items-start gap-2.5 text-xs text-sif-high">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successInfo && (
            <div className="p-4 rounded-xl bg-accent/15 border border-accent/35 space-y-2 text-xs">
              <div className="flex items-start gap-2.5 text-content-primary font-semibold">
                <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>Recovery Protocol Initiated</span>
              </div>
              <p className="text-content-secondary leading-relaxed text-[11px]">
                {successInfo}
              </p>
            </div>
          )}

          {!successInfo ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-content-secondary uppercase tracking-wider">
                  Corporate Work Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3.5 text-content-muted pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#14111A] border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Directory...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reset Link</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated text-content-primary text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-accent" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          )}

          <div className="text-center pt-2 border-t border-border">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-accent font-semibold hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl w-full mx-auto text-center py-2 text-[11px] text-content-muted">
        <span>SAFENEXA • Enterprise HSE Safety Intelligence & Barrier Governance</span>
      </footer>
    </div>
  );
}
