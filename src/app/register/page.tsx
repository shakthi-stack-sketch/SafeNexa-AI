'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Flame, Lock, Mail, User as UserIcon, Building2, Briefcase, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { UserRole } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<UserRole>('HSE Officer');
  const [adminAuthCode, setAdminAuthCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client validations: Full Name, Email, Password, Confirm Password
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in Full Name, Email, Password, and Confirm Password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid work email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const result = await register({
      name: name.trim(),
      email: email.trim(),
      organization: organization.trim() || 'General HSE',
      role,
      password,
      confirmPassword,
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/login?email=${encodeURIComponent(email.trim())}&registered=true`);
      }, 1800);
    } else {
      setError(result.error || 'Failed to create enterprise account.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none transition-colors">
      {/* Top Header */}
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

      {/* Main Card */}
      <main className="max-w-lg w-full mx-auto my-auto py-6">
        <div className="p-7 sm:p-8 rounded-2xl bg-bg-primary border border-border shadow-card space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-content-primary tracking-tight">
              Create Enterprise Account
            </h1>
            <p className="text-xs text-content-muted leading-relaxed">
              Register authorized access to the SAFENEXA safety intelligence platform.
            </p>
          </div>

          {/* Error Banner with Sign In Instead Link on Duplicate Email */}
          {error && (
            <div className="p-3.5 rounded-xl bg-sif-high/15 border border-sif-high/30 space-y-2 text-xs text-sif-high">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </div>
              {error.toLowerCase().includes('already exists') && (
                <div className="pt-1">
                  <Link
                    href={`/login?email=${encodeURIComponent(email)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-secondary hover:bg-bg-elevated border border-border text-content-primary font-bold text-xs transition-colors"
                  >
                    <span>Sign in instead</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="p-4 rounded-xl bg-sif-low/15 border border-sif-low/30 space-y-2 text-center text-xs text-sif-low">
              <div className="flex items-center justify-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Account created successfully.</span>
              </div>
              <p className="text-content-secondary">Redirecting to Sign In...</p>
              <div className="pt-1">
                <Link
                  href={`/login?email=${encodeURIComponent(email)}&registered=true`}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors shadow-subtle"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-content-secondary uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 absolute left-3.5 text-content-muted pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Barua"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Work Email */}
            <div className="space-y-1">
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
                  placeholder="name@oilindia.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Organization & Role (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-content-secondary uppercase tracking-wider">
                  Organization
                </label>
                <div className="relative flex items-center">
                  <Building2 className="w-4 h-4 absolute left-3.5 text-content-muted pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Oil India Limited"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-content-secondary uppercase tracking-wider">
                  Operational Role
                </label>
                <div className="relative flex items-center">
                  <Briefcase className="w-4 h-4 absolute left-3.5 text-content-muted pointer-events-none" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none transition-colors"
                  >
                    <option value="HSE Officer">HSE Officer</option>
                    <option value="HSE Manager">HSE Manager</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
              </div>
            </div>


            {/* Password & Confirm Password (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-content-secondary uppercase tracking-wider">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3.5 text-content-muted pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-content-secondary uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-content-muted hover:text-content-primary"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3.5 text-content-muted pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none transition-colors font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-2.5 px-4 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#14111A] border-t-transparent rounded-full animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="text-center pt-2 border-t border-border">
            <p className="text-xs text-content-muted">
              Already have an enterprise account?{' '}
              <Link href="/login" className="text-accent font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl w-full mx-auto text-center py-2 text-[11px] text-content-muted">
        <span>SAFENEXA • Enterprise HSE Safety Intelligence & Barrier Governance</span>
      </footer>
    </div>
  );
}
