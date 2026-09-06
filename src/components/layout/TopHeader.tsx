'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, PlusCircle, UploadCloud, User as UserIcon, LogOut, Settings, ShieldCheck, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { UploadReportModal } from '../upload/UploadReportModal';
import { BatchImportModal } from '../upload/BatchImportModal';
import { useAuth } from '@/lib/auth/AuthContext';

interface TopHeaderProps {
  onMenuClick?: () => void;
  title?: string;
  subtitle?: string;
}

export function TopHeader({ onMenuClick, title = 'Safety Intelligence Overview', subtitle }: TopHeaderProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const { user, logout, isAdmin } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = user?.name || 'HSE User';
  const userRole = user?.role || 'HSE Officer';
  const userOrg = user?.organization || 'Enterprise HSE';
  const userEmail = user?.email || 'authenticated@safenexa.com';

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-20 h-16 bg-bg-primary/95 backdrop-blur-md border-b border-border px-4 md:px-8 flex items-center justify-between transition-colors">
        {/* Left: Mobile Menu Toggle & Title */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <button
            onClick={onMenuClick}
            type="button"
            aria-label="Open Navigation Menu"
            className="md:hidden p-2 rounded-xl border border-border bg-bg-secondary text-content-secondary hover:text-content-primary transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-bold text-content-primary tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-content-muted truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Prominent + Upload Report Button */}
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors shadow-subtle"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Upload Report</span>
          </button>

          {/* Import CSV/XLSX Button */}
          <button
            type="button"
            onClick={() => setIsBatchOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated text-xs font-semibold text-content-secondary hover:text-content-primary transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-accent" />
            <span>Import CSV/XLSX</span>
          </button>

          {/* Notifications / Alerts Link */}
          <Link
            href="/alerts"
            title="View Active HSE Alerts"
            aria-label="View Active HSE Alerts"
            className="relative p-2 rounded-xl border border-border bg-bg-secondary text-content-secondary hover:text-content-primary hover:bg-bg-elevated transition-colors"
          >
            <Bell className="w-4 h-4" />
          </Link>

          {/* Theme Toggle in Header (Mobile) */}
          <div className="md:hidden">
            <ThemeToggle />
          </div>

          {/* User Profile Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated transition-colors shadow-subtle group"
              aria-label="User Profile Menu"
              title="Account & Profile Menu"
            >
              <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-xs font-bold font-mono">
                {initials || <UserIcon className="w-4 h-4" />}
              </div>
              <div className="hidden lg:block text-left min-w-0 max-w-[120px]">
                <div className="text-xs font-semibold text-content-primary truncate leading-tight">
                  {userName}
                </div>
                <div className="text-[10px] text-accent font-medium truncate">
                  {userRole}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-content-muted group-hover:text-content-primary transition-transform duration-150" />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-bg-elevated border border-border shadow-dropdown py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-border space-y-1">
                  <div className="text-xs font-bold text-content-primary truncate">
                    {userName}
                  </div>
                  <div className="text-[11px] text-content-muted truncate font-mono">
                    {userEmail}
                  </div>
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-bg-secondary border border-border text-accent">
                      {userRole}
                    </span>
                    <span className="text-[11px] text-content-muted truncate max-w-[120px]">
                      {userOrg}
                    </span>
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="p-1 space-y-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-content-secondary hover:text-content-primary hover:bg-bg-secondary transition-colors text-left"
                  >
                    <UserIcon className="w-4 h-4 text-accent" />
                    <span>User Profile Details</span>
                  </button>

                  {isAdmin && (
                    <Link
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-content-secondary hover:text-content-primary hover:bg-bg-secondary transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-accent" />
                      <span>System Settings & Thresholds</span>
                    </Link>
                  )}
                </div>

                {/* Logout Button */}
                <div className="p-1 border-t border-border mt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsProfileOpen(false);
                      await logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sif-high hover:bg-sif-high/10 transition-colors text-xs font-semibold text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* User Profile Detail Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-bg-primary border border-border rounded-2xl shadow-card max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <h3 className="text-base font-bold text-content-primary">Corporate Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="text-xs text-content-muted hover:text-content-primary p-1"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-bg-secondary border border-border space-y-1">
                <span className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">Name</span>
                <p className="font-semibold text-content-primary text-sm">{userName}</p>
              </div>

              <div className="p-3 rounded-xl bg-bg-secondary border border-border space-y-1">
                <span className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">Corporate Email</span>
                <p className="font-mono text-content-primary">{userEmail}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-bg-secondary border border-border space-y-1">
                  <span className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">Assigned Role</span>
                  <p className="font-bold text-accent">{userRole}</p>
                </div>

                <div className="p-3 rounded-xl bg-bg-secondary border border-border space-y-1">
                  <span className="text-[10px] font-semibold text-content-muted uppercase tracking-wider">Organization</span>
                  <p className="font-semibold text-content-primary truncate">{userOrg}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload and Batch Modals */}
      <UploadReportModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <BatchImportModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
