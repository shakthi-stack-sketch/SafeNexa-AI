'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingState } from '@/components/ui/LoadingState';
import { Modal } from '@/components/ui/Modal';
import { UploadReportModal } from '@/components/upload/UploadReportModal';
import { BatchImportModal } from '@/components/upload/BatchImportModal';
import {
  Bell,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Clock,
  Filter,
  PlusCircle,
  UploadCloud,
  Database,
  Inbox,
} from 'lucide-react';
import { HSEAlert } from '@/lib/types';

export default function AlertsPage() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<HSEAlert[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeAlertDetail, setActiveAlertDetail] = useState<HSEAlert | null>(null);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

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

  const handleLoadDemo = async () => {
    setIsLoadingDemo(true);
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'load' }),
      });
      if (res.ok) {
        await fetchAlerts();
      }
    } catch (err) {
      console.error('Failed to load demo:', err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleUpdateStatus = async (alertId: string, newStatus: HSEAlert['status']) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId, status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
        if (activeAlertDetail?.id === alertId) {
          setActiveAlertDetail(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (selectedSeverity && a.severity !== selectedSeverity) return false;
      if (selectedStatus && a.status !== selectedStatus) return false;
      return true;
    });
  }, [alerts, selectedSeverity, selectedStatus]);

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH' && a.status === 'ACTIVE').length;
  const hasAlerts = alerts.length > 0;

  return (
    <AppShell
      title="HSE Precursor Alerts & Notifications"
      subtitle="Automated alerts generated from high-risk SIF patterns and critical barrier breakdowns."
    >
      {/* Top Summary Banner: 100% interactive cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => {
            setSelectedSeverity('');
            setSelectedStatus('');
          }}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between shadow-subtle hover:-translate-y-0.5 ${
            !selectedSeverity && !selectedStatus
              ? 'bg-bg-elevated border-accent shadow-card'
              : 'bg-bg-primary border-border hover:border-accent/40'
          }`}
        >
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-content-muted">
              Total Alerts
            </div>
            <div className="text-2xl font-bold font-mono text-content-primary mt-1">
              {hasAlerts ? alerts.length : '—'}
            </div>
            <div className="text-[10px] text-accent mt-0.5 font-medium">Click to show all</div>
          </div>
          <Bell className="w-6 h-6 text-accent" />
        </div>

        <div
          onClick={() => {
            setSelectedSeverity('HIGH');
            setSelectedStatus('');
          }}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between shadow-subtle hover:-translate-y-0.5 ${
            selectedSeverity === 'HIGH'
              ? 'bg-sif-high-bg border-sif-high shadow-card'
              : 'bg-bg-primary border-sif-high/40 hover:border-sif-high/70'
          }`}
        >
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-sif-high">
              Active High Severity
            </div>
            <div className="text-2xl font-bold font-mono text-sif-high mt-1">
              {hasAlerts ? highCount : '—'}
            </div>
            <div className="text-[10px] text-sif-high mt-0.5 font-medium">Click to filter High</div>
          </div>
          <AlertTriangle className="w-6 h-6 text-sif-high" />
        </div>

        <div
          onClick={() => {
            setSelectedSeverity('');
            setSelectedStatus('ACTIVE');
          }}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between shadow-subtle hover:-translate-y-0.5 ${
            selectedStatus === 'ACTIVE' && !selectedSeverity
              ? 'bg-bg-elevated border-accent-secondary shadow-card'
              : 'bg-bg-primary border-border hover:border-accent-secondary/50'
          }`}
        >
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-content-muted">
              Pending Resolution
            </div>
            <div className="text-2xl font-bold font-mono text-content-primary mt-1">
              {hasAlerts ? activeCount : '—'}
            </div>
            <div className="text-[10px] text-accent-secondary mt-0.5 font-medium">Click to filter Pending</div>
          </div>
          <ShieldAlert className="w-6 h-6 text-accent-secondary" />
        </div>
      </div>

      {/* Filter Bar: Only when alerts exist */}
      {hasAlerts && (
        <div className="p-4 rounded-2xl bg-bg-primary border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-content-muted">
            <Filter className="w-3.5 h-3.5 text-accent" />
            <span>Alert Filters ({filteredAlerts.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
            >
              <option value="">All Severities</option>
              <option value="HIGH">HIGH Only</option>
              <option value="MEDIUM">MEDIUM Only</option>
              <option value="LOW">LOW Only</option>
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

            {(selectedSeverity || selectedStatus) && (
              <button
                onClick={() => {
                  setSelectedSeverity('');
                  setSelectedStatus('');
                }}
                className="text-xs text-accent hover:underline px-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading HSE alert registry from database..." />
      ) : !hasAlerts ? (
        /* Empty State: Zero alerts */
        <div className="p-12 rounded-2xl bg-bg-primary border border-border text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-accent mx-auto shadow-subtle">
            <Inbox className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-content-primary mb-1">
              No Active Alerts
            </h3>
            <p className="text-xs text-content-muted leading-relaxed">
              Alerts are generated automatically when a high SIF-potential observation or recurring precursor cluster is detected in the database.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors shadow-subtle"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Upload Report</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBatchOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated text-xs font-semibold text-content-primary transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-accent" />
              <span>Import CSV/XLSX</span>
            </button>
          </div>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="p-12 rounded-2xl bg-bg-primary border border-border text-center">
          <p className="text-base font-bold text-content-primary mb-1">No alerts match current filters</p>
          <p className="text-xs text-content-muted">All filtered condition triggers are currently addressed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isHigh = alert.severity === 'HIGH';
            const isResolved = alert.status === 'RESOLVED';

            return (
              <div
                key={alert.id}
                onClick={() => setActiveAlertDetail(alert)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
                  isResolved
                    ? 'bg-bg-primary/60 border-border opacity-70'
                    : isHigh
                    ? 'bg-bg-primary border-sif-high/40 shadow-subtle hover:border-sif-high'
                    : 'bg-bg-primary border-border hover:border-accent/40'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-accent bg-bg-secondary px-2 py-0.5 rounded border border-border">
                        {alert.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isHigh
                            ? 'bg-sif-high-bg text-sif-high border-sif-high/40'
                            : 'bg-sif-medium-bg text-sif-medium border-sif-medium/40'
                        }`}
                      >
                        {alert.severity} SEVERITY
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-content-muted bg-bg-secondary px-2 py-0.5 rounded border border-border">
                        {alert.status}
                      </span>
                      <span className="text-xs text-content-muted">
                        {alert.site} • {alert.activity}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-content-primary group-hover:text-accent transition-colors leading-snug">
                      {alert.trigger}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-content-muted pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-accent" />
                        {new Date(alert.created_at).toLocaleDateString()}
                      </span>
                      {alert.assigned_to && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-accent" />
                          Assigned: {alert.assigned_to}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0" onClick={(e) => e.stopPropagation()}>
                    {alert.report_id && (
                      <Link
                        href={`/reports/${alert.report_id}`}
                        className="px-2.5 py-1.5 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated text-xs font-medium text-content-secondary hover:text-accent transition-colors inline-flex items-center gap-1"
                        title="Investigate source safety report"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Investigate</span>
                      </Link>
                    )}
                    {alert.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(alert.id, 'ACKNOWLEDGED')}
                        className="px-2.5 py-1.5 rounded-xl border border-accent/30 bg-accent/10 hover:bg-accent/20 text-xs font-semibold text-accent transition-colors"
                        title="Mark Under Review / Acknowledged"
                      >
                        Under Review
                      </button>
                    )}
                    {alert.status !== 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(alert.id, 'RESOLVED')}
                        className="px-2.5 py-1.5 rounded-xl bg-sif-low-bg text-sif-low border border-sif-low/30 hover:bg-sif-low/20 text-xs font-semibold transition-colors"
                        title="Mark Resolved"
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveAlertDetail(alert)}
                      className="px-2.5 py-1.5 rounded-xl border border-border bg-bg-secondary text-content-secondary hover:text-accent hover:bg-bg-elevated transition-colors text-xs font-medium inline-flex items-center gap-1"
                      title="View Details"
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

      {/* Alert Detail Modal */}
      <Modal
        isOpen={!!activeAlertDetail}
        onClose={() => setActiveAlertDetail(null)}
        title={`Alert Details: ${activeAlertDetail?.id}`}
        subtitle={`${activeAlertDetail?.severity} Severity • Status: ${activeAlertDetail?.status}`}
        maxWidth="xl"
      >
        {activeAlertDetail && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-bg-secondary border border-border space-y-2">
              <span className="font-bold uppercase tracking-wider text-content-muted text-[10px] block">
                Trigger Narrative
              </span>
              <p className="text-sm font-medium text-content-primary leading-relaxed">
                {activeAlertDetail.trigger}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-bg-secondary border border-border">
                <span className="text-[10px] font-semibold text-content-muted block">Operational Site</span>
                <span className="text-sm font-medium text-content-primary">{activeAlertDetail.site}</span>
              </div>
              <div className="p-3 rounded-xl bg-bg-secondary border border-border">
                <span className="text-[10px] font-semibold text-content-muted block">Operational Activity</span>
                <span className="text-sm font-medium text-content-primary">{activeAlertDetail.activity}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-bg-secondary border border-border">
              <span className="text-[10px] font-semibold text-content-muted block mb-1">Precursor Identified</span>
              <span className="text-xs font-mono text-sif-high font-semibold">{activeAlertDetail.precursor}</span>
            </div>

            {activeAlertDetail.report_id && (
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-content-muted block">Associated Safety Observation</span>
                  <span className="font-mono font-bold text-accent">{activeAlertDetail.report_id}</span>
                </div>
                <Link
                  href={`/reports/${activeAlertDetail.report_id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                >
                  <span>Investigate Report</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-content-muted">
                Assigned: {activeAlertDetail.assigned_to || 'Unassigned'}
              </span>
              <div className="flex items-center gap-2">
                {activeAlertDetail.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(activeAlertDetail.id, 'ACKNOWLEDGED')}
                    className="px-3 py-1.5 rounded-xl border border-border bg-bg-secondary text-xs font-semibold hover:bg-bg-elevated text-content-primary"
                  >
                    Acknowledge
                  </button>
                )}
                {activeAlertDetail.status !== 'RESOLVED' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(activeAlertDetail.id, 'RESOLVED')}
                    className="px-4 py-1.5 rounded-xl bg-sif-low text-white font-bold text-xs hover:opacity-90 transition-opacity"
                  >
                    Resolve Alert
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload and Batch Modals */}
      <UploadReportModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => fetchAlerts()}
      />
      <BatchImportModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onSuccess={() => fetchAlerts()}
      />
    </AppShell>
  );
}
