'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingState } from '@/components/ui/LoadingState';
import { Modal } from '@/components/ui/Modal';
import {
  Bell,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Clock,
  Filter,
  Volume2,
  VolumeX,
  Radio,
  Zap,
  CheckCircle2,
  Send,
  RefreshCw,
  Sliders,
  Layers,
  Info,
  Check,
  Flame,
  Camera,
} from 'lucide-react';
import { HSEAlert, AlertSeverity } from '@/lib/types';
import { sirenController } from '@/lib/audio/siren';

export default function SafetyAlertCenterPage() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<HSEAlert[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [activeAlertDetail, setActiveAlertDetail] = useState<HSEAlert | null>(null);

  // Siren state
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Unattended timer / auto-escalation countdown demo state
  const [autoEscalateEnabled, setAutoEscalateEnabled] = useState(true);
  const [countdownMap, setCountdownMap] = useState<Record<string, number>>({});
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Subscribe to audible siren state
  useEffect(() => {
    const unsubscribe = sirenController.subscribe((active) => {
      setIsSirenActive(active);
      setIsMuted(sirenController.getIsMuted());
    });
    return () => unsubscribe();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Countdown timer for unattended critical alerts
  useEffect(() => {
    const interval = setInterval(() => {
      if (!autoEscalateEnabled) return;

      setCountdownMap((prev) => {
        const next = { ...prev };
        alerts
          .filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE')
          .forEach((a) => {
            if (next[a.id] === undefined) {
              next[a.id] = 30; // 30s demo interval
            } else if (next[a.id] > 0) {
              next[a.id] -= 1;
              if (next[a.id] === 0) {
                // Auto escalate unattended alert
                handleEscalate(a.id, 'Senior Management (Auto-Escalated: Unattended Alert Timer Expired)');
              }
            }
          });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [alerts, autoEscalateEnabled]);

  // Handle Acknowledgement
  const handleAcknowledge = async (alertId: string) => {
    setActionInProgressId(alertId);
    try {
      const res = await fetch('/api/alerts/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alertId,
          acknowledged_by: 'Asset HSE Lead Officer',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? data.alert : a)));
        if (activeAlertDetail?.id === alertId) {
          setActiveAlertDetail(data.alert);
        }

        // Stop audible alarm if this was the sounding critical event
        sirenController.stopSiren();

        setFeedbackToast(`Alert ${alertId} acknowledged. Audible alarm silenced.`);
        setTimeout(() => setFeedbackToast(null), 4000);
      }
    } catch (err) {
      console.error('Acknowledgement failed:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Handle Escalation (triggers n8n workflow)
  const handleEscalate = async (alertId: string, customEscalationTarget?: string) => {
    setActionInProgressId(alertId);
    try {
      const res = await fetch('/api/alerts/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alertId,
          escalated_to: customEscalationTarget || 'Executive Management & Asset HSE Lead',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? data.alert : a)));
        if (activeAlertDetail?.id === alertId) {
          setActiveAlertDetail(data.alert);
        }

        // Stop siren after escalation
        sirenController.stopSiren();

        setFeedbackToast(
          `🚨 Alert ${alertId} escalated to Management. Workflow status: ${data.automation?.status || 'Dispatched'}`
        );
        setTimeout(() => setFeedbackToast(null), 5000);
      }
    } catch (err) {
      console.error('Escalation failed:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (selectedSeverity && a.severity !== selectedSeverity) return false;
      if (selectedStatus && a.status !== selectedStatus) return false;
      if (selectedSource && (a.source || 'manual') !== selectedSource) return false;
      return true;
    });
  }, [alerts, selectedSeverity, selectedStatus, selectedSource]);

  // Priority counts
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH' && a.status === 'ACTIVE').length;
  const mediumCount = alerts.filter((a) => a.severity === 'MEDIUM' && a.status === 'ACTIVE').length;
  const lowCount = alerts.filter((a) => a.severity === 'LOW' && a.status === 'ACTIVE').length;
  const visionCount = alerts.filter((a) => a.source === 'computer_vision').length;

  return (
    <AppShell
      title="Safety Alert Center"
      subtitle="Centralized multi-channel safety event triage, priority categorization, and response automation."
    >
      <div className="space-y-5">
        {/* Audible Siren Banner if active */}
        {isSirenActive && (
          <div className="p-4 rounded-2xl bg-sif-high-bg border-2 border-sif-high shadow-card flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sif-high text-white flex items-center justify-center font-bold shrink-0">
                <Volume2 className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-sif-high block">
                    🔊 AUDIBLE ALERT ACTIVE — CRITICAL SAFETY EVENT
                  </span>
                  <span className="text-[10px] font-mono bg-sif-high text-white px-2 py-0.5 rounded font-bold">
                    LOCAL ALARM
                  </span>
                </div>
                <p className="text-[11px] text-content-muted mt-0.5">
                  High-intensity dual-tone audible alert active on local terminal.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => sirenController.stopSiren()}
                className="px-4 py-2 rounded-xl bg-sif-high text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-subtle inline-flex items-center gap-1.5"
              >
                <VolumeX className="w-4 h-4" />
                <span>Mute / Stop Alert</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Toast */}
        {feedbackToast && (
          <div className="p-3.5 rounded-2xl bg-bg-elevated border border-accent/40 text-xs font-medium text-content-primary shadow-card flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span>{feedbackToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackToast(null)}
              className="text-[11px] text-content-muted hover:text-content-primary px-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Multi-Channel Response Philosophy Bar */}
        <div className="p-4 rounded-2xl bg-bg-primary border border-border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-content-primary uppercase tracking-wider">
                Multi-Tier Incident Triage & Response
              </span>
              <p className="text-content-muted text-[11px] leading-relaxed">
                Prioritizes safety events into 4 distinct response tiers to ensure critical precursor conditions receive immediate frontline and managerial intervention.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label className="flex items-center gap-2 text-xs text-content-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoEscalateEnabled}
                onChange={(e) => setAutoEscalateEnabled(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent w-4 h-4"
              />
              <span className="font-medium text-[11px]">Unattended Timer (30s Demo)</span>
            </label>
            <Link
              href="/live-monitor"
              className="px-3 py-1.5 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated text-xs font-semibold text-content-primary transition-colors inline-flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-accent" />
              <span>Safety Monitor</span>
            </Link>
          </div>
        </div>

        {/* Priority Filter Metric Cards: CRITICAL / HIGH / MEDIUM / LOW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* CRITICAL Card */}
          <div
            onClick={() => {
              setSelectedSeverity(selectedSeverity === 'CRITICAL' ? '' : 'CRITICAL');
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-subtle hover:-translate-y-0.5 flex items-center justify-between ${
              selectedSeverity === 'CRITICAL'
                ? 'bg-sif-high-bg border-sif-high shadow-card'
                : 'bg-bg-primary border-border hover:border-sif-high/60'
            }`}
          >
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-sif-high flex items-center gap-1">
                <span>CRITICAL</span>
                {criticalCount > 0 && <span className="w-2 h-2 rounded-full bg-sif-high animate-ping" />}
              </div>
              <div className="text-2xl font-bold font-mono text-sif-high mt-0.5">
                {criticalCount}
              </div>
              <div className="text-[10px] text-content-muted mt-0.5">
                Audible Alert • Immediate Attention
              </div>
            </div>
            <Flame className="w-6 h-6 text-sif-high" />
          </div>

          {/* HIGH Card */}
          <div
            onClick={() => {
              setSelectedSeverity(selectedSeverity === 'HIGH' ? '' : 'HIGH');
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-subtle hover:-translate-y-0.5 flex items-center justify-between ${
              selectedSeverity === 'HIGH'
                ? 'bg-amber-500/15 border-amber-500 shadow-card'
                : 'bg-bg-primary border-border hover:border-amber-500/60'
            }`}
          >
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-500">
                HIGH SIF
              </div>
              <div className="text-2xl font-bold font-mono text-amber-500 mt-0.5">
                {highCount}
              </div>
              <div className="text-[10px] text-content-muted mt-0.5">
                Dashboard Alert • HSE Review
              </div>
            </div>
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>

          {/* MEDIUM Card */}
          <div
            onClick={() => {
              setSelectedSeverity(selectedSeverity === 'MEDIUM' ? '' : 'MEDIUM');
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-subtle hover:-translate-y-0.5 flex items-center justify-between ${
              selectedSeverity === 'MEDIUM'
                ? 'bg-bg-elevated border-accent-secondary shadow-card'
                : 'bg-bg-primary border-border hover:border-accent-secondary/60'
            }`}
          >
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-content-muted">
                MEDIUM
              </div>
              <div className="text-2xl font-bold font-mono text-content-primary mt-0.5">
                {mediumCount}
              </div>
              <div className="text-[10px] text-content-muted mt-0.5">
                Barrier Tracking • Intelligence
              </div>
            </div>
            <ShieldAlert className="w-6 h-6 text-accent-secondary" />
          </div>

          {/* LOW Card */}
          <div
            onClick={() => {
              setSelectedSeverity(selectedSeverity === 'LOW' ? '' : 'LOW');
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-subtle hover:-translate-y-0.5 flex items-center justify-between ${
              selectedSeverity === 'LOW'
                ? 'bg-emerald-500/15 border-emerald-500 shadow-card'
                : 'bg-bg-primary border-border hover:border-emerald-500/60'
            }`}
          >
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">
                LOW
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-500 mt-0.5">
                {lowCount}
              </div>
              <div className="text-[10px] text-content-muted mt-0.5">
                Routine Analytics • No Siren
              </div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        {/* Filters Bar */}
        <div className="p-3.5 rounded-2xl bg-bg-primary border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-content-muted">
            <Filter className="w-3.5 h-3.5 text-accent" />
            <span>Alert Registry ({filteredAlerts.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">CRITICAL Only</option>
              <option value="HIGH">HIGH Only</option>
              <option value="MEDIUM">MEDIUM Only</option>
              <option value="LOW">LOW Only</option>
            </select>

            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
            >
              <option value="">All Sources</option>
              <option value="computer_vision">Computer Vision ({visionCount})</option>
              <option value="manual">Safety Reports</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="ESCALATED">ESCALATED</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>

            {(selectedSeverity || selectedSource || selectedStatus) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSeverity('');
                  setSelectedSource('');
                  setSelectedStatus('');
                }}
                className="text-accent hover:underline px-2 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Alerts Feed */}
        {loading ? (
          <LoadingState message="Triaging prioritized safety alerts..." />
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 rounded-2xl bg-bg-primary border border-border text-center max-w-md mx-auto space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-content-primary">No Matching Alerts</h3>
            <p className="text-xs text-content-muted leading-relaxed">
              All filtered conditions are addressed. Observations generated by the Safety Monitor will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const isCritical = alert.severity === 'CRITICAL';
              const isHigh = alert.severity === 'HIGH';
              const isVision = alert.source === 'computer_vision';
              const isAcknowledged = alert.status === 'ACKNOWLEDGED';
              const isEscalated = alert.status === 'ESCALATED';
              const isResolved = alert.status === 'RESOLVED';
              const remainingCountdown = countdownMap[alert.id];

              return (
                <div
                  key={alert.id}
                  onClick={() => setActiveAlertDetail(alert)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer group shadow-subtle ${
                    isResolved
                      ? 'bg-bg-primary/60 border-border opacity-70'
                      : isCritical
                      ? 'bg-bg-primary border-sif-high shadow-card hover:border-sif-high'
                      : isHigh
                      ? 'bg-bg-primary border-amber-500/50 hover:border-amber-500'
                      : 'bg-bg-primary border-border hover:border-accent/40'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Details */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* ID */}
                        <span className="font-mono text-xs font-bold text-accent bg-bg-secondary px-2 py-0.5 rounded border border-border">
                          {alert.id}
                        </span>

                        {/* Severity Badge */}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                            isCritical
                              ? 'bg-sif-high text-white border-sif-high font-extrabold animate-pulse'
                              : isHigh
                              ? 'bg-amber-500/15 text-amber-500 border-amber-500/40'
                              : 'bg-bg-secondary text-content-muted border-border'
                          }`}
                        >
                          {alert.severity} PRIORITY
                        </span>

                        {/* Source Badge */}
                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                            isVision
                              ? 'bg-accent/15 text-accent border-accent/40 font-bold'
                              : 'bg-bg-secondary text-content-muted border-border'
                          }`}
                        >
                          {isVision ? 'Source: Computer Vision' : 'Source: Safety Report'}
                        </span>

                        {/* Status Badge */}
                        {isAcknowledged ? (
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Acknowledged by HSE</span>
                          </span>
                        ) : isEscalated ? (
                          <span className="text-[10px] font-bold text-sif-high bg-sif-high-bg border border-sif-high/40 px-2 py-0.5 rounded flex items-center gap-1">
                            <span>🚨 Escalated to Management</span>
                          </span>
                        ) : isResolved ? (
                          <span className="text-[10px] font-semibold text-content-muted bg-bg-secondary border border-border px-2 py-0.5 rounded">
                            Resolved
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                            Action Required
                          </span>
                        )}

                        <span className="text-xs text-content-muted">
                          {alert.site} • {alert.activity}
                        </span>
                      </div>

                      {/* Trigger Title */}
                      <h4 className="text-sm font-semibold text-content-primary group-hover:text-accent transition-colors leading-snug">
                        {alert.trigger}
                      </h4>

                      {/* Precursor and Required Action */}
                      <div className="text-xs text-content-secondary flex flex-wrap items-center gap-y-1 gap-x-3">
                        <span className="text-sif-high font-mono font-medium">
                          Precursor: {alert.precursor}
                        </span>
                        {alert.required_action && (
                          <span className="text-content-muted italic">
                            Action: {alert.required_action}
                          </span>
                        )}
                      </div>

                      {/* Timestamps and Meta */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-content-muted pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-accent" />
                          {new Date(alert.created_at).toLocaleTimeString()} ({new Date(alert.created_at).toLocaleDateString()})
                        </span>

                        {alert.acknowledged_at && (
                          <span className="text-emerald-500 font-medium">
                            ✓ Acknowledged: {new Date(alert.acknowledged_at).toLocaleTimeString()}
                          </span>
                        )}

                        {alert.escalated_at && (
                          <span className="text-sif-high font-medium">
                            🚨 Escalated: {new Date(alert.escalated_at).toLocaleTimeString()}
                          </span>
                        )}

                        {/* Unattended Countdown Timer Pill */}
                        {isCritical && alert.status === 'ACTIVE' && remainingCountdown !== undefined && remainingCountdown > 0 && (
                          <span className="text-amber-400 font-mono font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                            Auto-Escalation in: {remainingCountdown}s
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Interactive Action Buttons: [ACKNOWLEDGE] [ESCALATE] */}
                    <div
                      className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Investigate Link */}
                      {alert.report_id && (
                        <Link
                          href={`/reports/${alert.report_id}`}
                          className="px-3 py-1.5 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated text-xs font-medium text-content-secondary hover:text-accent transition-colors inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Investigate</span>
                        </Link>
                      )}

                      {/* [ACKNOWLEDGE] Button */}
                      {!isAcknowledged && !isResolved && (
                        <button
                          type="button"
                          disabled={actionInProgressId === alert.id}
                          onClick={() => handleAcknowledge(alert.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-subtle inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Acknowledge</span>
                        </button>
                      )}

                      {/* [ESCALATE] Button */}
                      {!isEscalated && !isResolved && (
                        <button
                          type="button"
                          disabled={actionInProgressId === alert.id}
                          onClick={() => handleEscalate(alert.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-sif-high hover:bg-red-600 text-white font-bold text-xs transition-colors shadow-subtle inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Escalate to Management</span>
                        </button>
                      )}

                      {/* Details Drilldown */}
                      <button
                        type="button"
                        onClick={() => setActiveAlertDetail(alert)}
                        className="px-3 py-1.5 rounded-xl border border-border bg-bg-secondary text-content-secondary hover:text-accent hover:bg-bg-elevated transition-colors text-xs font-medium inline-flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Alert Detail Drilldown */}
        <Modal
          isOpen={!!activeAlertDetail}
          onClose={() => setActiveAlertDetail(null)}
          title={`Safety Alert: ${activeAlertDetail?.id}`}
          subtitle={`${activeAlertDetail?.severity} Priority • Status: ${activeAlertDetail?.status}`}
          maxWidth="xl"
        >
          {activeAlertDetail && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-bg-secondary border border-border space-y-2">
                <span className="font-bold uppercase tracking-wider text-content-muted text-[10px] block">
                  Alert Trigger
                </span>
                <p className="text-sm font-medium text-content-primary leading-relaxed">
                  {activeAlertDetail.trigger}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-bg-secondary border border-border">
                  <span className="text-[10px] font-semibold text-content-muted block">Location / Zone</span>
                  <span className="text-sm font-medium text-content-primary">{activeAlertDetail.site}</span>
                </div>
                <div className="p-3 rounded-xl bg-bg-secondary border border-border">
                  <span className="text-[10px] font-semibold text-content-muted block">Source Channel</span>
                  <span className="text-sm font-medium text-accent font-mono">
                    {activeAlertDetail.source === 'computer_vision' ? 'Safety Monitor' : 'Manual Report'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-bg-secondary border border-border">
                <span className="text-[10px] font-semibold text-content-muted block mb-1">SIF Precursor</span>
                <span className="text-xs font-mono text-sif-high font-semibold">{activeAlertDetail.precursor}</span>
              </div>

              {activeAlertDetail.required_action && (
                <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-accent tracking-wider block">
                    Required Action
                  </span>
                  <p className="text-xs text-content-primary leading-relaxed">
                    {activeAlertDetail.required_action}
                  </p>
                </div>
              )}

              {/* Status Audit Trail */}
              <div className="p-3.5 rounded-xl bg-bg-secondary border border-border space-y-2">
                <span className="text-[10px] font-bold uppercase text-content-muted tracking-wider block">
                  Triage Audit Trail
                </span>
                <div className="space-y-1 text-[11px] font-mono text-content-secondary">
                  <div>Created: {new Date(activeAlertDetail.created_at).toLocaleString()}</div>
                  {activeAlertDetail.acknowledged_at && (
                    <div className="text-emerald-500">
                      Acknowledged: {new Date(activeAlertDetail.acknowledged_at).toLocaleString()} by {activeAlertDetail.acknowledged_by || 'HSE Lead'}
                    </div>
                  )}
                  {activeAlertDetail.escalated_at && (
                    <div className="text-sif-high">
                      Escalated: {new Date(activeAlertDetail.escalated_at).toLocaleString()} to {activeAlertDetail.escalated_to || 'Management'}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-content-muted text-[11px]">
                  Assigned: {activeAlertDetail.assigned_to || 'Asset HSE Lead'}
                </span>
                <div className="flex items-center gap-2">
                  {activeAlertDetail.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(activeAlertDetail.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Acknowledge
                    </button>
                  )}
                  {activeAlertDetail.status !== 'ESCALATED' && activeAlertDetail.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      onClick={() => handleEscalate(activeAlertDetail.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-sif-high hover:bg-red-600 text-white font-bold text-xs"
                    >
                      Escalate to Management
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveAlertDetail(null)}
                    className="px-4 py-1.5 rounded-xl border border-border bg-bg-secondary text-content-primary font-semibold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
