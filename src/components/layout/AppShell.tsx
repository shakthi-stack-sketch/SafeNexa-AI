'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { DemoBanner } from './DemoBanner';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppShell({ children, title, subtitle }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-bg text-content-primary">
      {/* Sidebar (Desktop persistent + Mobile drawer) */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          onMenuClick={() => setMobileMenuOpen(true)}
          title={title}
          subtitle={subtitle}
        />

        {/* Prominent Demo Notice Banner when Demo Mode is Active */}
        <DemoBanner />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>

        {/* Subtle Product Footer */}
        <footer className="py-3.5 px-6 border-t border-border bg-bg-primary text-xs text-content-muted">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <span className="font-bold tracking-wider text-accent text-xs">
              SAFENEXA
            </span>
            <span className="text-[11px] text-content-muted">
              AI Safety & SIF Precursor Intelligence
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
