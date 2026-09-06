'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { RiskHeatmapMatrix } from '@/components/charts/RiskHeatmapMatrix';
import { SifTrendChart } from '@/components/charts/SifTrendChart';
import { LoadingState } from '@/components/ui/LoadingState';
import { UploadReportModal } from '@/components/upload/UploadReportModal';
import { BatchImportModal } from '@/components/upload/BatchImportModal';
import {
  Brain,
  Info,
  Sliders,
  TrendingUp,
  PlusCircle,
  UploadCloud,
  Database,
  Inbox,
  Lock,
} from 'lucide-react';

interface IntelSummary {
  totalReports: number;
  sifReportsCount: number;
  mediumReportsCount: number;
  lowReportsCount: number;
  sifDensity: number;
  activeAlertsCount: number;
}

interface HeatmapData {
  activities: string[];
  locations: string[];
  matrix: Record<string, Record<string, { total: number; sif: number }>>;
  hasLocationData: boolean;
}

interface TrendPoint {
  date: string;
  sifPotential: number;
  nonSif: number;
}

interface RankedItem {
  name: string;
  total: number;
  sifCount: number;
  density: number;
}

interface ModelEvaluation {
  evaluatedOn: string;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1Score: number | null;
  classDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  note: string;
}

export default function HseIntelligencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<IntelSummary | null>(null);
  const [siteRanking, setSiteRanking] = useState<RankedItem[]>([]);
  const [activityRanking, setActivityRanking] = useState<RankedItem[]>([]);
  const [modelEval, setModelEval] = useState<ModelEvaluation | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  // Filters
  const [timeFilter, setTimeFilter] = useState('6M');

  const loadIntelligence = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hse/intelligence');
      const data = await res.json();
      setSummary(data.summary);
      setSiteRanking(data.siteRanking || []);
      setActivityRanking(data.activityRanking || []);
      setModelEval(data.modelEvaluation);
      setHeatmapData(data.heatmap || null);
      setTrendData(data.trendData || []);
    } catch (err) {
      console.error('Failed to load HSE intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntelligence();
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
        await loadIntelligence();
      }
    } catch (err) {
      console.error('Failed to load demo:', err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const hasData = summary && summary.totalReports > 0;

  return (
    <AppShell
      title="HSE Intelligence"
      subtitle="Strategic risk ranking, precursor density analytics, and model performance."
    >
      {/* Metric Documentation Notice */}
      <div className="p-4 rounded-2xl bg-bg-primary border border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-content-primary uppercase tracking-wider">
              Safety Metric: SIF Precursor Density
            </span>
            <p className="text-content-secondary leading-relaxed">
              Calculated as <code className="font-mono text-accent">SIF-Potential Reports ÷ Total Analyzed Observations</code>.
              Identifies disproportionate high-energy barrier vulnerability before severe harm occurs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
          >
            <option value="30D">Last 30 Days</option>
            <option value="3M">Last 3 Months</option>
            <option value="6M">Last 6 Months (Default)</option>
            <option value="1Y">Trailing 12 Months</option>
          </select>

          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated text-xs font-medium text-content-secondary hover:text-content-primary transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-accent" />
            <span>Thresholds</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Aggregating cross-asset HSE intelligence from database..." />
      ) : !hasData ? (
        /* Empty State: Zero reports in database */
        <div className="p-12 rounded-2xl bg-bg-primary border border-border text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-accent mx-auto shadow-subtle">
            <Inbox className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-content-primary mb-1">
              No Intelligence Data Available
            </h3>
            <p className="text-xs text-content-muted leading-relaxed">
              Upload safety reports or import a dataset to generate asset risk rankings, activity heatmaps, and precursor metrics.
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
        <>
          {/* Section 1: Executive Risk Ranking Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Facility Ranking */}
            <div className="p-5 rounded-2xl bg-bg-primary border border-border shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                      Asset Risk Ranking (by Density)
                    </h3>
                    <p className="text-xs text-content-muted">
                      Facilities with highest ratio of high-potential safety precursors
                    </p>
                  </div>
                  <span className="text-xs font-mono text-accent font-bold">
                    {siteRanking.length} Assets
                  </span>
                </div>

                <div className="space-y-2.5">
                  {siteRanking.map((item, idx) => (
                    <div
                      key={item.name}
                      onClick={() => router.push(`/reports?site=${encodeURIComponent(item.name)}`)}
                      className="p-3 rounded-xl bg-bg-secondary border border-border hover:border-accent/40 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-bg-elevated border border-border text-accent flex items-center justify-center font-mono font-bold text-[10px]">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-content-primary group-hover:text-accent transition-colors truncate">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-content-muted">
                            {item.sifCount} SIF flagged / {item.total} total reports
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-20 h-2 bg-bg-elevated rounded-full overflow-hidden border border-border hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              item.density >= 70
                                ? 'bg-sif-high'
                                : item.density >= 50
                                ? 'bg-sif-medium'
                                : 'bg-accent'
                            }`}
                            style={{ width: `${item.density}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-content-primary">
                          {item.density}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Operational Activity Ranking */}
            <div className="p-5 rounded-2xl bg-bg-primary border border-border shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                      Activity Hazard Ranking
                    </h3>
                    <p className="text-xs text-content-muted">
                      Operations presenting highest frequency of critical barrier failures
                    </p>
                  </div>
                  <span className="text-xs font-mono text-accent font-bold">
                    {activityRanking.length} Activities
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activityRanking.map((item, idx) => (
                    <div
                      key={item.name}
                      onClick={() => router.push(`/reports?q=${encodeURIComponent(item.name)}`)}
                      className="p-3 rounded-xl bg-bg-secondary border border-border hover:border-accent/40 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-bg-elevated border border-border text-accent flex items-center justify-center font-mono font-bold text-[10px]">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-content-primary group-hover:text-accent transition-colors truncate">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-content-muted">
                            {item.sifCount} SIF flagged / {item.total} total reports
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-20 h-2 bg-bg-elevated rounded-full overflow-hidden border border-border hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              item.density >= 70
                                ? 'bg-sif-high'
                                : item.density >= 50
                                ? 'bg-sif-medium'
                                : 'bg-accent'
                            }`}
                            style={{ width: `${item.density}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-content-primary">
                          {item.density}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Interactive Operational Heatmap */}
          <div className="p-5 rounded-2xl bg-bg-primary border border-border shadow-subtle">
            <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                  Activity × Location Precursor Concentration
                </h3>
                <p className="text-xs text-content-muted">
                  Interactive matrix correlating specific operational tasks with asset geographic clusters
                </p>
              </div>
            </div>
            <RiskHeatmapMatrix
              activities={heatmapData?.activities}
              locations={heatmapData?.locations}
              matrix={heatmapData?.matrix}
              hasLocationData={heatmapData?.hasLocationData}
              onCellClick={(_act, loc) => router.push(`/reports?q=${encodeURIComponent(loc)}`)}
            />
          </div>

          {/* Section 3: SIF Potential Trend Analysis */}
          <div className="p-5 rounded-2xl bg-bg-primary border border-border shadow-subtle">
            <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                    SIF Potential Trend Over Time
                  </h3>
                  <p className="text-xs text-content-muted">
                    Temporal trajectory comparing high-severity precursors against low-energy safety observations
                  </p>
                </div>
              </div>
            </div>
            {trendData && trendData.length >= 2 ? (
              <SifTrendChart data={trendData} height={250} />
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-xl text-xs text-content-muted">
                <span className="font-semibold text-content-primary mb-1">Insufficient Data for Trend Analysis</span>
                <span className="text-[11px] opacity-75">Analyze additional safety reports to generate meaningful safety intelligence.</span>
              </div>
            )}
          </div>

          {/* Section 4: AI Model Evaluation & Governance */}
          <div className="p-6 rounded-2xl bg-bg-primary border border-border shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <Brain className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                    AI/NLP Model Evaluation
                  </h3>
                  <p className="text-xs text-content-muted">
                    Governance standard: Model evaluation is derived solely from validated ground-truth benchmarks.
                  </p>
                </div>
              </div>
            </div>

            {modelEval ? (
              <div className="p-4 rounded-xl bg-bg-secondary border border-border text-xs space-y-2">
                <div className="font-bold text-content-primary">
                  {modelEval.evaluatedOn}
                </div>
                <div className="flex items-center gap-4 text-content-muted">
                  <span>High SIF: {modelEval.classDistribution.high}</span>
                  <span>Medium SIF: {modelEval.classDistribution.medium}</span>
                  <span>Low SIF: {modelEval.classDistribution.low}</span>
                </div>
                <p className="text-content-muted pt-1 border-t border-border">
                  {modelEval.note}
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-bg-secondary border border-border flex items-center gap-3.5 text-xs text-content-muted">
                <Lock className="w-5 h-5 text-accent shrink-0" />
                <div>
                  <div className="font-bold text-content-primary mb-0.5">
                    Formal Evaluation Benchmarks Pending OIL Labeled Dataset
                  </div>
                  <p className="leading-relaxed">
                    Evaluation metrics (Precision, Recall, F1, and Confusion Matrix) will appear after validated labeled ground-truth data is provided by Oil India Limited. The platform does not fabricate model accuracy.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <UploadReportModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => loadIntelligence()}
      />
      <BatchImportModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onSuccess={() => loadIntelligence()}
      />
    </AppShell>
  );
}
