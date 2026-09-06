'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { KpiCard } from '@/components/ui/KpiCard';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { SifTrendChart } from '@/components/charts/SifTrendChart';
import { PrecursorDensityBarChart } from '@/components/charts/PrecursorDensityBarChart';
import { LifeSavingRuleDonut } from '@/components/charts/LifeSavingRuleDonut';
import { RiskHeatmapMatrix } from '@/components/charts/RiskHeatmapMatrix';
import { LoadingState } from '@/components/ui/LoadingState';
import { UploadReportModal } from '@/components/upload/UploadReportModal';
import { BatchImportModal } from '@/components/upload/BatchImportModal';
import {
  FileText,
  AlertTriangle,
  Zap,
  Bell,
  ArrowRight,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Filter,
  UploadCloud,
  Database,
  Inbox,
} from 'lucide-react';
import { Report, PrecursorPattern, LifeSavingRule } from '@/lib/types';

export default function OverviewDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [patterns, setPatterns] = useState<PrecursorPattern[]>([]);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [intelData, setIntelData] = useState<any>(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [repRes, patRes, altRes, intelRes] = await Promise.all([
        fetch('/api/reports?limit=10'),
        fetch('/api/patterns'),
        fetch('/api/alerts'),
        fetch('/api/hse/intelligence'),
      ]);

      const repData = await repRes.json();
      const patData = await patRes.json();
      const altData = await altRes.json();
      const iData = await intelRes.json();

      setReports(repData.reports || []);
      setPatterns(patData.patterns || []);
      setActiveAlertsCount(altData.active || 0);
      setIntelData(iData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
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
        await loadDashboardData();
      }
    } catch (err) {
      console.error('Failed to load demo data:', err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const sifReports = reports.filter((r) => r.sif_potential === 'HIGH');
  const highRiskPrecursorsCount = patterns.filter((p) => p.sif_density >= 0.7).length;
  const hasReports = reports.length > 0;

  const handleRuleFilter = (rule: LifeSavingRule) => {
    router.push(`/reports?rule=${encodeURIComponent(rule)}`);
  };

  const handleDensityBarClick = (item: { name: string }) => {
    router.push(`/reports?site=${encodeURIComponent(item.name)}`);
  };

  const handleHeatmapCellClick = (_activity: string, location: string) => {
    router.push(`/reports?q=${encodeURIComponent(location)}`);
  };

  return (
    <AppShell
      title="Safety Intelligence Overview"
      subtitle="Real-time visibility into SIF potential, precursors and critical safety patterns."
    >
      {loading ? (
        <LoadingState message="Connecting to database and calculating safety metrics..." />
      ) : !hasReports ? (
        /* Strict Clean Empty State when database contains 0 reports */
        <div className="p-12 rounded-2xl bg-bg-primary border border-border text-center max-w-xl mx-auto space-y-4 my-12 shadow-subtle animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-accent mx-auto shadow-subtle">
            <Inbox className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-content-primary">
              No Safety Intelligence Available Yet
            </h2>
            <p className="text-xs text-content-muted max-w-md mx-auto leading-relaxed">
              Upload and analyze safety reports to begin identifying SIF precursors, risk patterns, and safety trends.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-all duration-150 shadow-subtle hover:-translate-y-0.5 active:translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Upload Safety Report</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top Operational Status Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-bg-primary border border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-content-primary">
                  Database Connected — Live Safety Intelligence
                </h2>
                <p className="text-xs text-content-muted">
                  {reports.length} safety observation{reports.length === 1 ? '' : 's'} registered across operational assets.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-all duration-150 shadow-subtle hover:-translate-y-0.5 active:translate-y-0.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Upload Report</span>
              </button>
              <Link
                href="/reports"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border bg-bg-secondary text-content-secondary hover:text-content-primary hover:bg-bg-elevated transition-colors text-xs font-medium"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>View All</span>
              </Link>
            </div>
          </div>

          {/* Top KPI Cards Grid: 100% interactive cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Analyzed Reports"
              value={reports.length}
              subtitle="Actual database records"
              icon={FileText}
              onClick={() => router.push('/reports')}
            />
            <KpiCard
              title="SIF-Potential Flagged"
              value={sifReports.length}
              subtitle={`${Math.round((sifReports.length / Math.max(1, reports.length)) * 100)}% precursor density`}
              icon={AlertTriangle}
              highlight={sifReports.length > 0}
              onClick={() => router.push('/reports?sif=HIGH')}
            />
            <KpiCard
              title="High-Risk Precursors"
              value={highRiskPrecursorsCount}
              subtitle={`${patterns.length} recurring clusters`}
              icon={Zap}
              onClick={() => router.push('/patterns')}
            />
            <KpiCard
              title="Active HSE Alerts"
              value={activeAlertsCount}
              subtitle={activeAlertsCount > 0 ? 'Action needed' : 'Zero active triggers'}
              icon={Bell}
              badge={activeAlertsCount > 0 ? 'PRIORITY' : undefined}
              onClick={() => router.push('/alerts?status=ACTIVE')}
            />
          </div>

          {/* Row 2: SIF Potential Trend & Precursor Density Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: SIF Potential Trend */}
            <div className="p-5 rounded-2xl bg-bg-primary border border-border shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                    SIF Potential Trend
                  </h3>
                  <p className="text-xs text-content-muted">
                    High SIF vs Non-SIF report trajectory
                  </p>
                </div>
              </div>
              {hasReports && intelData?.trendData && intelData.trendData.length > 0 ? (
                <SifTrendChart data={intelData.trendData} height={250} />
              ) : (
                <div className="h-[250px] flex flex-col items-center justify-center text-center p-6 text-xs text-content-muted border border-dashed border-border rounded-xl">
                  <span className="font-semibold text-content-primary mb-1">Insufficient Data for Trend Analysis</span>
                  <span className="text-[11px] opacity-75">Analyze additional safety reports to generate meaningful safety intelligence.</span>
                </div>
              )}
            </div>

            {/* Card 2: SIF Precursor Density */}
            <div className="p-5 rounded-2xl bg-bg-primary border border-border shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                    SIF Precursor Density by Asset
                  </h3>
                  <p className="text-xs text-content-muted">
                    Ratio of high SIF potential observations per operational facility
                  </p>
                </div>
              </div>
              {hasReports && intelData?.siteRanking && intelData.siteRanking.length > 0 ? (
                <PrecursorDensityBarChart data={intelData.siteRanking} height={250} onBarClick={handleDensityBarClick} />
              ) : (
                <div className="h-[250px] flex flex-col items-center justify-center text-center p-6 text-xs text-content-muted border border-dashed border-border rounded-xl">
                  <span>No asset density data available.</span>
                  <span className="text-[11px] opacity-75 mt-1">Upload observations to rank facility precursor risk.</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Life-Saving Rule Distribution & Top Precursor Patterns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 3: Life-Saving Rule Distribution */}
            <div className="p-5 rounded-2xl bg-bg-primary border border-border shadow-subtle">
              <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                    Life-Saving Rule Distribution
                  </h3>
                  <p className="text-xs text-content-muted">
                    Mapped IOGP Life-Saving Rules breakdown across active reports
                  </p>
                </div>
              </div>
              {hasReports && intelData?.ruleDistribution && intelData.ruleDistribution.length > 0 ? (
                <LifeSavingRuleDonut data={intelData.ruleDistribution} height={240} onSelectRule={handleRuleFilter} />
              ) : (
                <div className="h-[240px] flex flex-col items-center justify-center text-center p-6 text-xs text-content-muted border border-dashed border-border rounded-xl">
                  <span>No rule mappings recorded yet.</span>
                </div>
              )}
            </div>

            {/* Card 4: Top Precursor Patterns */}
            <div className="p-5 rounded-2xl bg-bg-primary border border-border shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                      Top Precursor Patterns
                    </h3>
                    <p className="text-xs text-content-muted">
                      Recurring multi-event barrier failures identified by clustering
                    </p>
                  </div>
                  {patterns.length > 0 && (
                    <Link
                      href="/patterns"
                      className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      View All ({patterns.length}) <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {patterns.length > 0 ? (
                  <div className="space-y-2.5">
                    {patterns.slice(0, 4).map((pattern) => (
                      <div
                        key={pattern.id}
                        className="p-3 rounded-xl bg-bg-secondary border border-border hover:border-accent/40 transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-content-primary truncate group-hover:text-accent transition-colors">
                              {pattern.pattern_name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-elevated border border-border text-content-muted">
                              {pattern.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-content-muted truncate">
                            <span>{pattern.activity}</span>
                            <span>•</span>
                            <span className="text-content-secondary">{pattern.location}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-sif-high font-mono">
                            {Math.round(pattern.sif_density * 100)}% SIF
                          </div>
                          <div className="text-[10px] text-content-muted">
                            {pattern.frequency} events
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center text-center p-6 text-xs text-content-muted border border-dashed border-border rounded-xl">
                    <span>Not enough analyzed reports to identify reliable recurring patterns.</span>
                    <span className="text-[11px] opacity-75 mt-1">Upload at least 3 reports to discover clusters.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 5: Risk Heatmap (Activity × Location) */}
          <div className="p-5 rounded-2xl bg-bg-primary border border-border shadow-subtle">
            <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                  Operational Risk Matrix
                </h3>
                <p className="text-xs text-content-muted">
                  Cross-asset heat distribution: Activity vs Location precursor density
                </p>
              </div>
            </div>
            {hasReports ? (
              <RiskHeatmapMatrix onCellClick={handleHeatmapCellClick} />
            ) : (
              <div className="h-[180px] flex flex-col items-center justify-center text-center p-6 text-xs text-content-muted border border-dashed border-border rounded-xl">
                <span>Risk heatmap will populate as observations across facilities are logged.</span>
              </div>
            )}
          </div>

          {/* Card 6: Recent High-Risk Reports */}
          <div className="p-5 rounded-2xl bg-bg-primary border border-border shadow-subtle">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                  Recent High-Risk Reports
                </h3>
                <p className="text-xs text-content-muted">
                  Latest safety observations flagged by AI for serious injury potential
                </p>
              </div>
              {hasReports && (
                <Link
                  href="/reports"
                  className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-medium"
                >
                  Browse All Reports <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {hasReports ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border text-content-muted uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Report ID</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Site</th>
                      <th className="py-2.5 px-3">Activity</th>
                      <th className="py-2.5 px-3">Life-Saving Rule</th>
                      <th className="py-2.5 px-3">SIF Potential</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {reports.slice(0, 6).map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-bg-secondary transition-colors group cursor-pointer"
                        onClick={() => router.push(`/reports/${report.id}`)}
                      >
                        <td className="py-3 px-3 font-mono font-medium text-accent">
                          {report.id}
                        </td>
                        <td className="py-3 px-3 text-content-muted">
                          {report.date}
                        </td>
                        <td className="py-3 px-3 font-medium text-content-primary">
                          {report.site}
                        </td>
                        <td className="py-3 px-3 text-content-secondary max-w-[180px] truncate">
                          {report.activity}
                        </td>
                        <td className="py-3 px-3 text-content-secondary">
                          <span className="px-2 py-0.5 rounded bg-bg-secondary border border-border text-[11px]">
                            {report.life_saving_rule}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <RiskBadge level={report.sif_potential} size="sm" />
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] text-content-muted">
                            {report.review_status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/reports/${report.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-content-muted group-hover:text-accent font-medium transition-colors"
                          >
                            <span>Review</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-content-muted border border-dashed border-border rounded-xl">
                <span>No safety reports recorded yet. Upload a report above to begin.</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <UploadReportModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => loadDashboardData()}
      />
      <BatchImportModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onSuccess={() => loadDashboardData()}
      />
    </AppShell>
  );
}
