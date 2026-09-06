'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Cpu,
  FileText,
  Network,
  ShieldAlert,
  Bell,
  MessageSquareDiff,
  Settings,
  X,
  Flame,
  UserCheck
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/types';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  allowedRoles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/', icon: LayoutDashboard, allowedRoles: ['HSE Officer', 'HSE Manager', 'Administrator'] },
  { label: 'Report Analyzer', href: '/analyzer', icon: Cpu, badge: 'AI', allowedRoles: ['HSE Officer', 'HSE Manager', 'Administrator'] },
  { label: 'Reports', href: '/reports', icon: FileText, allowedRoles: ['HSE Officer', 'HSE Manager', 'Administrator'] },
  { label: 'Precursor Patterns', href: '/patterns', icon: Network, allowedRoles: ['HSE Officer', 'HSE Manager', 'Administrator'] },
  { label: 'HSE Intelligence', href: '/hse-intelligence', icon: ShieldAlert, allowedRoles: ['HSE Officer', 'HSE Manager', 'Administrator'] },
  { label: 'Alerts', href: '/alerts', icon: Bell, allowedRoles: ['HSE Officer', 'HSE Manager', 'Administrator'] },
  { label: 'Feedback', href: '/feedback', icon: MessageSquareDiff, allowedRoles: ['HSE Officer', 'HSE Manager', 'Administrator'] },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAdmin, loading } = useAuth();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-bg-primary border-r border-border select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <Link href="/" className="flex items-start gap-3 group" onClick={onClose}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent-secondary/20 border border-accent/40 flex items-center justify-center text-accent shadow-subtle group-hover:border-accent transition-colors">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-content-primary text-base tracking-wide">SAFENEXA</span>
            </div>
            <p className="text-[11px] text-content-muted leading-tight mt-0.5 font-medium">
              AI Safety & SIF Precursor Intelligence
            </p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-bg-secondary"
            aria-label="Close Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-content-muted">
          Operational Views
        </div>
        {NAV_ITEMS.filter((item) => (!user ? true : item.allowedRoles.includes(user.role))).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-accent/15 text-content-primary font-bold shadow-subtle border border-accent/40'
                  : 'text-content-secondary hover:text-content-primary hover:bg-bg-secondary'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-accent' : 'text-content-muted group-hover:text-content-secondary'
                  }`}
                />
                <span className={isActive ? 'text-content-primary font-bold' : ''}>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                    isActive
                      ? 'bg-accent/20 text-content-primary border-accent/40 font-bold'
                      : 'bg-bg-secondary text-content-muted border-border'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Controls & User Profile */}
      <div className="p-3 border-t border-border space-y-3 bg-bg-primary">
        {isAdmin && (
          <Link
            href="/settings"
            onClick={onClose}
            className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-sm transition-colors ${
              pathname === '/settings'
                ? 'bg-accent/15 text-content-primary font-bold border border-accent/40'
                : 'text-content-secondary hover:text-content-primary hover:bg-bg-secondary'
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings className={`w-4 h-4 ${pathname === '/settings' ? 'text-accent' : 'text-content-muted'}`} />
              <span className="font-medium">Settings & Thresholds</span>
            </div>
          </Link>
        )}

        <div className="flex items-center justify-between px-2 pt-1">
          <span className="text-xs text-content-muted">Interface Theme</span>
          <ThemeToggle />
        </div>

        {/* User Profile Card */}
        <div className="p-2.5 rounded-xl bg-bg-secondary border border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-accent shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-content-primary truncate">
              {user?.name || (loading ? 'Loading...' : 'HSE Personnel')}
            </div>
            <div className="text-[11px] text-content-muted truncate flex items-center gap-1.5">
              <span>{user?.role || 'Safety Intelligence'}</span>
              {user?.organization && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="truncate">{user.organization}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-bg shadow-dropdown"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
