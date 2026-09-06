'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  Sliders,
  RotateCcw,
  Save,
  CheckCircle2,
  Info,
  BookOpen,
  Trash2,
  Lock,
  Database,
  RefreshCw,
  Server,
} from 'lucide-react';
import { IOGP_RULES_CONFIG, ALL_LIFE_SAVING_RULES } from '@/lib/rules/iogp_rules';
import { useAuth } from '@/lib/auth/AuthContext';

interface DatabaseStatus {
  mode: 'postgresql' | 'json';
  configured: boolean;
  connected: boolean;
  provider: string;
  details: string;
}

export default function SettingsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [highThreshold, setHighThreshold] = useState(0.75);
  const [medThreshold, setMedThreshold] = useState(0.45);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null);
  const [isSyncingDb, setIsSyncingDb] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.thresholds) {
          setHighThreshold(data.thresholds.high);
          setMedThreshold(data.thresholds.medium);
        }
        if (data.database) {
          setDatabaseStatus(data.database);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thresholds: {
            high: highThreshold,
            medium: medThreshold,
          },
        }),
      });
      if (res.ok) {
        setSaveMessage('Model confidence thresholds updated successfully. All active reports re-evaluated.');
        setTimeout(() => setSaveMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncToPostgres = async () => {
    setIsSyncingDb(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_postgres' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveMessage(data.message || 'Data successfully migrated to PostgreSQL.');
        if (data.database) setDatabaseStatus(data.database);
        setTimeout(() => setSaveMessage(null), 5000);
      } else {
        alert(data.message || 'Synchronization failed. Please check your PostgreSQL connection.');
      }
    } catch (err) {
      console.error('Failed to sync to PostgreSQL:', err);
      alert('An error occurred during synchronization.');
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Reset model classification thresholds to standard defaults (0.75 / 0.45)?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thresholds: {
            high: 0.75,
            medium: 0.45,
          },
        }),
      });
      if (res.ok) {
        setHighThreshold(0.75);
        setMedThreshold(0.45);
        setSaveMessage('Thresholds restored to standard defaults.');
        setTimeout(() => setSaveMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('Permanently clear all stored safety reports, patterns, and alerts from the database? This cannot be undone.')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_all' }),
      });
      if (res.ok) {
        setSaveMessage('Database records cleared. Application reset to clean state.');
        setTimeout(() => setSaveMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  if (!authLoading && !isAdmin) {
    return (
      <AppShell
        title="System Settings & Model Thresholds"
        subtitle="Calibrate NLP confidence boundaries, manage IOGP Life-Saving Rules, and configure decision thresholds."
      >
        <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-sif-high/15 border border-sif-high/30 flex items-center justify-center text-sif-high shadow-subtle">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-content-primary">Administrator Privilege Required</h2>
            <p className="text-sm text-content-secondary max-w-md mx-auto">
              System threshold calibration, NLP model cutoffs, and database maintenance controls are restricted to SAFENEXA Administrators.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-bg-secondary border border-border inline-block text-left text-xs space-y-1.5 min-w-[280px]">
            <div className="text-content-muted font-medium">Active Session Identity:</div>
            <div className="font-semibold text-content-primary flex items-center justify-between">
              <span>{user?.name || 'HSE User'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-bg-elevated border border-border text-accent font-bold">
                {user?.role || 'Restricted'}
              </span>
            </div>
            <div className="text-content-muted font-mono text-[11px]">{user?.email}</div>
          </div>
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors shadow-subtle"
            >
              Return to Operational Overview
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="System Settings & Model Thresholds"
      subtitle="Calibrate NLP confidence boundaries, manage IOGP Life-Saving Rules, and configure database storage."
    >
      {loading ? (
        <LoadingState message="Loading system settings..." />
      ) : (
        <div className="space-y-6">
          {saveMessage && (
            <div className="p-4 rounded-xl bg-accent/15 border border-accent/30 text-xs text-accent font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveMessage}</span>
            </div>
          )}

          {/* Section 1: Dual-Mode Database Engine Status */}
          <div className="p-6 rounded-2xl bg-bg-primary border border-border shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                    Database Architecture & Dual-Mode Status
                  </h3>
                  <p className="text-xs text-content-muted">
                    Supports PostgreSQL with Prisma ORM and automatic fallback to local JSON file storage.
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border ${
                  databaseStatus?.mode === 'postgresql' && databaseStatus?.connected
                    ? 'bg-sif-low/15 border-sif-low/30 text-sif-low'
                    : 'bg-accent/15 border-accent/30 text-accent'
                }`}
              >
                {databaseStatus?.mode === 'postgresql' && databaseStatus?.connected
                  ? 'PostgreSQL Active'
                  : 'JSON Fallback Active'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-bg-secondary border border-border space-y-1.5">
                <div className="text-[11px] text-content-muted flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-accent" />
                  <span>Current Storage Engine</span>
                </div>
                <div className="font-semibold text-xs text-content-primary">
                  {databaseStatus?.provider || 'Local JSON File Storage'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-bg-secondary border border-border space-y-1.5">
                <div className="text-[11px] text-content-muted">Prisma ORM Status</div>
                <div className="font-semibold text-xs text-content-primary flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      databaseStatus?.configured && databaseStatus?.connected
                        ? 'bg-sif-low'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span>
                    {databaseStatus?.configured
                      ? databaseStatus.connected
                        ? 'Connected to PostgreSQL'
                        : 'Configured (Host Unreachable)'
                      : 'Standby (DATABASE_URL Not Set)'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-bg-secondary border border-border space-y-1.5">
                <div className="text-[11px] text-content-muted">Data Integrity Mode</div>
                <div className="font-semibold text-xs text-content-primary">
                  {databaseStatus?.mode === 'postgresql'
                    ? 'ACID Relational + JSONB'
                    : 'Atomic File Sync + Cache'}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-bg-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-content-secondary">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {databaseStatus?.details ||
                    'To connect PostgreSQL, set DATABASE_URL in your .env file. When unset, the platform runs offline using local JSON.'}
                </p>
              </div>

              {databaseStatus?.configured && (
                <button
                  type="button"
                  disabled={isSyncingDb}
                  onClick={handleSyncToPostgres}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors shadow-subtle shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDb ? 'Migrating...' : 'Sync JSON to PostgreSQL'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Configurable SIF Potential Thresholds */}
          <div className="p-6 rounded-2xl bg-bg-primary border border-border shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                    SIF Potential Classification Thresholds
                  </h3>
                  <p className="text-xs text-content-muted">
                    Defines the numeric score boundaries separating High, Medium, and Low SIF potential.
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-bg-secondary border border-border text-accent">
                Configurable
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-bg-secondary border border-border flex items-start gap-2.5 text-xs text-content-secondary">
              <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p>
                <strong>Classification Standards:</strong> These cutoffs govern automated SIF potential escalation levels.
                Adjusting thresholds dynamically recalibrates classifications across all registered safety observations.
              </p>
            </div>

            <form onSubmit={handleSaveThresholds} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* High Threshold Slider */}
                <div className="p-4 rounded-xl bg-bg-secondary border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sif-high uppercase tracking-wider">
                      HIGH SIF Threshold (≥)
                    </span>
                    <span className="font-mono text-base font-bold text-sif-high">
                      {highThreshold.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={0.95}
                    step={0.01}
                    value={highThreshold}
                    onChange={(e) => setHighThreshold(parseFloat(e.target.value))}
                    className="w-full accent-sif-high cursor-pointer"
                  />
                  <p className="text-[11px] text-content-muted">
                    Scores at or above {highThreshold.toFixed(2)} trigger immediate High SIF containment workflows.
                  </p>
                </div>

                {/* Medium Threshold Slider */}
                <div className="p-4 rounded-xl bg-bg-secondary border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sif-medium uppercase tracking-wider">
                      MEDIUM SIF Threshold (≥)
                    </span>
                    <span className="font-mono text-base font-bold text-sif-medium">
                      {medThreshold.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={0.7}
                    step={0.01}
                    value={medThreshold}
                    onChange={(e) => setMedThreshold(parseFloat(e.target.value))}
                    className="w-full accent-sif-medium cursor-pointer"
                  />
                  <p className="text-[11px] text-content-muted">
                    Scores between {medThreshold.toFixed(2)} and {(highThreshold - 0.01).toFixed(2)} are classified as Medium SIF.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors shadow-subtle"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Thresholds</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 3: IOGP 9 Life-Saving Rules Reference */}
          <div className="p-6 rounded-2xl bg-bg-primary border border-border shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                    IOGP 9 Life-Saving Rules Taxonomy
                  </h3>
                  <p className="text-xs text-content-muted">
                    International Association of Oil & Gas Producers (IOGP) authoritative safety framework.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-content-muted">
                9 Standard Rules Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ALL_LIFE_SAVING_RULES.map((rule) => {
                const meta = IOGP_RULES_CONFIG[rule];
                return (
                  <div
                    key={rule}
                    className="p-3.5 rounded-xl bg-bg-secondary border border-border space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-content-primary">
                        {rule}
                      </span>
                      <span className="font-mono text-[10px] text-accent px-1.5 py-0.5 rounded bg-bg-elevated border border-border">
                        {meta.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-content-muted line-clamp-2 leading-snug">
                      {meta.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Data Management & Calibration Reset */}
          <div className="p-6 rounded-2xl bg-bg-primary border border-border shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-content-primary">
                Threshold Calibration & Maintenance
              </h4>
              <p className="text-xs text-content-muted">
                Restore classification cutoffs to standard IOGP safety defaults (0.75 / 0.45) or reset stored records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetDefaults}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated text-xs font-semibold text-content-primary transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-accent" />
                <span>Reset Defaults</span>
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleClearAllData}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated text-xs font-semibold text-sif-high transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Database Records</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
