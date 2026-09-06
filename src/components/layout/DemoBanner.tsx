'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, Database, ShieldAlert } from 'lucide-react';

interface DemoBannerProps {
  onDemoStateChange?: () => void;
}

export function DemoBanner({ onDemoStateChange }: DemoBannerProps) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoCount, setDemoCount] = useState(0);
  const [isClearing, setIsClearing] = useState(false);

  const checkDemoState = async () => {
    try {
      const res = await fetch('/api/demo');
      const data = await res.json();
      setIsDemoMode(!!data.is_demo_mode && data.demo_count > 0);
      setDemoCount(data.demo_count || 0);
    } catch {
      // Ignore network errors
    }
  };

  useEffect(() => {
    checkDemoState();
    const interval = setInterval(checkDemoState, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleClearDemoData = async () => {
    setIsClearing(true);
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_demo' }),
      });
      if (res.ok) {
        setIsDemoMode(false);
        setDemoCount(0);
        if (onDemoStateChange) onDemoStateChange();
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to clear demo data:', err);
    } finally {
      setIsClearing(false);
    }
  };

  if (!isDemoMode) return null;

  return (
    <div className="bg-sif-medium/20 border-b border-sif-medium/40 text-sif-medium px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 font-semibold">
        <AlertTriangle className="w-4 h-4 shrink-0 text-sif-medium animate-pulse" />
        <span>
          DEMO DATA ACTIVE ({demoCount} synthetic records) — NOT REAL OIL DATA
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-content-muted hidden sm:inline">
          Demonstration dataset active. User-uploaded reports remain isolated.
        </span>
        <button
          type="button"
          disabled={isClearing}
          onClick={handleClearDemoData}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-bg-primary hover:bg-bg-elevated text-content-primary border border-border text-[11px] font-bold transition-colors shadow-subtle"
        >
          <Trash2 className="w-3 h-3 text-sif-high" />
          <span>{isClearing ? 'Clearing...' : 'Clear Demo Data'}</span>
        </button>
      </div>
    </div>
  );
}
