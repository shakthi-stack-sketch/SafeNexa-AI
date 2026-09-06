'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { KpiCard } from '@/components/ui/KpiCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { Modal } from '@/components/ui/Modal';
import { UploadReportModal } from '@/components/upload/UploadReportModal';
import { BatchImportModal } from '@/components/upload/BatchImportModal';
import {
  Network,
  Activity,
  ShieldX,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  ExternalLink,
  Lightbulb,
  Filter,
  PlusCircle,
  UploadCloud,
  Database,
  Inbox,
} from 'lucide-react';
import { PrecursorPattern, Report } from '@/lib/types';
import { ALL_LIFE_SAVING_RULES } from '@/lib/rules/iogp_rules';

export default function PrecursorPatternsPage() {
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState<PrecursorPattern[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  // Filters
  const [selectedRule, setSelectedRule] = useState('');
  const [selectedSite, setSelectedSite] = useState('');

  // Drilldown Modal
  const [selectedPattern, setSelectedPattern] = useState<PrecursorPattern | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [patRes, repRes] = await Promise.all([
        fetch('/api/patterns'),
        fetch('/api/reports?limit=100'),
      ]);
      const patData = await patRes.json();
      const repData = await repRes.json();
      setPatterns(patData.patterns || []);
      setReports(repData.reports || []);
    } catch (err) {
      console.error('Failed to load patterns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
        await loadData();
      }
    } catch (err) {
      console.error('Failed to load demo:', err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const filteredPatterns = useMemo(() => {
    return patterns.filter((p) => {
      if (selectedRule && p.life_saving_rule.toLowerCase() !== selectedRule.toLowerCase()) return false;
      if (selectedSite && !p.location.toLowerCase().includes(selectedSite.toLowerCase())) return false;
      return true;
    });
  }, [patterns, selectedRule, selectedSite]);

  // Derived KPI metrics (Computed 100% from actual data, never hardcoded)
  const uniqueActivitiesCount = useMemo(() => {
    return new Set(patterns.map((p) => p.activity)).size;
  }, [patterns]);

  const uniqueBarrierFailuresCount = useMemo(() => {
    return new Set(patterns.map((p) => p.barrier_failure)).size;
  }, [patterns]);

  const topSite = useMemo(() => {
    if (patterns.length === 0) return null;
    return patterns[0]?.location || null;
  }, [patterns]);

  // Representative reports for the active modal pattern
  const activePatternReports = useMemo(() => {
    if (!selectedPattern) return [];
    return reports.filter((r) =>
      selectedPattern.representative_report_ids.includes(r.id) ||
      (r.activity === selectedPattern.activity && r.barrier_failure === selectedPattern.barrier_failure)
    );
  }, [selectedPattern, reports]);

  const hasPatterns = patterns.length > 0;

  return (
    <AppShell
      title="Precursor Pattern Discovery"
      subtitle="Identify recurring activities, locations and barrier failures associated with SIF potential."
    >
      {loading ? (
        <LoadingState message="Discovering recurring precursor clusters from database..." />
      ) : (
        <>
          {/* Top KPI Cards: Real metrics, '—' if empty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Recurring Precursor Patterns"
              value={hasPatterns ? patterns.length : '—'}
              subtitle={hasPatterns ? 'Active cross-asset clusters' : 'No clusters detected'}
              icon={Network}
              highlight={hasPatterns}
            />
            <KpiCard
              title="High-Risk Activities"
              value={hasPatterns ? `${uniqueActivitiesCount} Focus Areas` : '—'}
              subtitle={hasPatterns ? 'Operations with recurring failures' : 'No data'}
              icon={Activity}
            />
            <KpiCard
              title="Critical Barrier Failures"
              value={hasPatterns ? `${uniqueBarrierFailuresCount} Deficiencies` : '—'}
              subtitle={hasPatterns ? 'Dominant breakdown categories' : 'No data'}
              icon={ShieldX}
            />
            <KpiCard
              title="Highest Density Location"
              value={topSite ? topSite : '—'}
              subtitle={topSite ? 'Facility with highest precursor concentration' : 'No data'}
              icon={MapPin}
            />
          </div>

          {/* Filter Bar: Only render when patterns exist */}
          {hasPatterns && (
            <div className="p-4 rounded-2xl bg-bg-primary border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-content-muted">
                <Filter className="w-3.5 h-3.5 text-accent" />
                <span>Filter Patterns ({filteredPatterns.length})</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedRule}
                  onChange={(e) => setSelectedRule(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
                >
                  <option value="">All Life-Saving Rules</option>
                  {ALL_LIFE_SAVING_RULES.map((rule) => (
                    <option key={rule} value={rule}>
                      {rule}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
                >
                  <option value="">All Locations</option>
                  {Array.from(new Set(patterns.map((p) => p.location))).map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>

                {(selectedRule || selectedSite) && (
                  <button
                    onClick={() => {
                      setSelectedRule('');
                      setSelectedSite('');
                    }}
                    className="text-xs text-accent hover:underline px-2"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Main Pattern Content / Empty State */}
          {!hasPatterns ? (
            <div className="p-12 rounded-2xl bg-bg-primary border border-border text-center max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-accent mx-auto shadow-subtle">
                <Inbox className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-content-primary mb-1">
                  No Recurring Patterns Detected
                </h3>
                <p className="text-xs text-content-muted leading-relaxed">
                  Recurring safety patterns will appear after sufficient reports have been analyzed.
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
          ) : (
            <div className="p-5 rounded-2xl bg-bg-primary border border-border shadow-subtle space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                    Ranked Precursor Clusters
                  </h3>
                  <p className="text-xs text-content-muted">
                    Ranked by SIF Precursor Density (SIF-potential occurrences / total observations)
                  </p>
                </div>
                <span className="text-xs text-content-muted">
                  Click any row for deep dive
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                  <thead>
                    <tr className="border-b border-border text-content-muted uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Pattern Cluster</th>
                      <th className="py-2.5 px-3">Activity</th>
                      <th className="py-2.5 px-3">Primary Location</th>
                      <th className="py-2.5 px-3">Barrier Failure</th>
                      <th className="py-2.5 px-3 text-center">Frequency</th>
                      <th className="py-2.5 px-3 text-center">SIF Count</th>
                      <th className="py-2.5 px-3">SIF Density</th>
                      <th className="py-2.5 px-3 text-center">Trend</th>
                      <th className="py-2.5 px-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredPatterns.map((p, idx) => {
                      const densityPct = Math.round(p.sif_density * 100);
                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedPattern(p)}
                          className="hover:bg-bg-secondary transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-bg-secondary border border-border text-accent flex items-center justify-center font-mono font-bold text-[10px]">
                                #{idx + 1}
                              </span>
                              <div>
                                <div className="font-semibold text-content-primary group-hover:text-accent transition-colors">
                                  {p.pattern_name}
                                </div>
                                <span className="text-[10px] text-content-muted font-mono">
                                  {p.id} • {p.life_saving_rule}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-content-secondary">
                            {p.activity}
                          </td>
                          <td className="py-3 px-3 text-content-secondary max-w-[140px] truncate">
                            {p.location}
                          </td>
                          <td className="py-3 px-3 text-content-muted max-w-[180px] truncate">
                            {p.barrier_failure}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-medium text-content-primary">
                            {p.frequency}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-sif-high">
                            {p.sif_count}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-bg-secondary rounded-full overflow-hidden border border-border">
                                <div
                                  className={`h-full rounded-full ${
                                    densityPct >= 75
                                      ? 'bg-sif-high'
                                      : densityPct >= 50
                                      ? 'bg-sif-medium'
                                      : 'bg-accent'
                                  }`}
                                  style={{ width: `${densityPct}%` }}
                                />
                              </div>
                              <span className="font-mono font-bold text-content-primary">
                                {densityPct}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {p.trend === 'up' && (
                              <span className="inline-flex items-center gap-0.5 text-sif-high text-[11px] font-semibold">
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>Rising</span>
                              </span>
                            )}
                            {p.trend === 'down' && (
                              <span className="inline-flex items-center gap-0.5 text-sif-low text-[11px] font-semibold">
                                <TrendingDown className="w-3.5 h-3.5" />
                                <span>Ebbing</span>
                              </span>
                            )}
                            {p.trend === 'stable' && (
                              <span className="inline-flex items-center gap-0.5 text-content-muted text-[11px]">
                                <Minus className="w-3.5 h-3.5" />
                                <span>Stable</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="inline-flex items-center gap-1 text-content-muted group-hover:text-accent font-medium text-xs">
                              <span>Inspect</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pattern Detail Drilldown Modal */}
      <Modal
        isOpen={!!selectedPattern}
        onClose={() => setSelectedPattern(null)}
        title={selectedPattern?.pattern_name || 'Pattern Cluster Investigation'}
        subtitle={`Cluster ${selectedPattern?.id} • Life-Saving Rule: ${selectedPattern?.life_saving_rule}`}
        maxWidth="2xl"
      >
        {selectedPattern && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-bg-elevated border border-accent/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold text-content-muted">
                  SIF Precursor Density
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-sif-high">
                    {Math.round(selectedPattern.sif_density * 100)}%
                  </span>
                  <span className="text-xs text-content-muted">
                    ({selectedPattern.sif_count} high SIF occurrences in {selectedPattern.frequency} observations)
                  </span>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-xs text-accent font-medium">
                Trend: {selectedPattern.trend.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-bg-secondary border border-border space-y-1">
                <span className="text-content-muted font-semibold uppercase text-[10px] block">
                  Associated Hazard
                </span>
                <span className="text-content-primary font-medium">
                  {selectedPattern.associated_hazard}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-bg-secondary border border-border space-y-1">
                <span className="text-content-muted font-semibold uppercase text-[10px] block">
                  Common Barrier Failure
                </span>
                <span className="text-sif-high font-medium">
                  {selectedPattern.barrier_failure}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
                <Lightbulb className="w-4 h-4" />
                <span>Recommended Systemic Intervention</span>
              </div>
              <p className="text-xs text-content-primary leading-relaxed">
                {selectedPattern.recommended_intervention}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-content-muted">
                <span>Associated Observations ({activePatternReports.length})</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activePatternReports.map((r) => (
                  <Link
                    key={r.id}
                    href={`/reports/${r.id}`}
                    className="p-3 rounded-xl bg-bg-secondary hover:bg-bg-elevated border border-border hover:border-accent/40 flex items-start justify-between gap-3 text-xs transition-colors group block"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-accent">
                          {r.id}
                        </span>
                        <span className="text-[11px] text-content-muted">
                          {r.date} • {r.site}
                        </span>
                      </div>
                      <p className="text-content-secondary line-clamp-1 text-xs">
                        {r.report_text}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-content-muted group-hover:text-accent shrink-0 mt-1" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedPattern(null)}
                className="px-4 py-2 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload and Batch Modals */}
      <UploadReportModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => loadData()}
      />
      <BatchImportModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onSuccess={() => loadData()}
      />
    </AppShell>
  );
}
