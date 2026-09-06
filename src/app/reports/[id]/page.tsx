'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { SifScoreCard } from '@/components/ui/SifScoreCard';
import { EntityGrid } from '@/components/ui/EntityCard';
import { EvidencePanel } from '@/components/ui/EvidencePanel';
import { RecommendationCard } from '@/components/ui/RecommendationCard';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  ShieldCheck,
  Edit3,
  Calendar,
  MapPin,
  FileText,
  UserCheck,
} from 'lucide-react';
import { Report, SIFPotential, LifeSavingRule } from '@/lib/types';
import { ALL_LIFE_SAVING_RULES } from '@/lib/rules/iogp_rules';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  // HSE Review interactive state
  const [reviewComment, setReviewComment] = useState('');
  const [correctedSif, setCorrectedSif] = useState<SIFPotential>('HIGH');
  const [correctedRule, setCorrectedRule] = useState<LifeSavingRule>('Confined Space');
  const [correctedPrecursor, setCorrectedPrecursor] = useState('');
  const [correctedBarrier, setCorrectedBarrier] = useState('');
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccessMessage, setFeedbackSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const res = await fetch(`/api/reports/${reportId}`);
        if (!res.ok) {
          throw new Error('Report not found');
        }
        const data: Report = await res.json();
        setReport(data);
        setCorrectedSif(data.sif_potential);
        setCorrectedRule(data.life_saving_rule);
        setCorrectedPrecursor(data.sif_precursor);
        setCorrectedBarrier(data.barrier_failure);
        if (data.reviewer_comment) {
          setReviewComment(data.reviewer_comment);
        }
      } catch (err: unknown) {
        console.error(err);
        setError('Unable to locate the specified safety observation report.');
      } finally {
        setLoading(false);
      }
    }
    if (reportId) loadReport();
  }, [reportId]);

  const handleQuickStatusUpdate = async (status: Report['review_status']) => {
    if (!report) return;
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          comment: reviewComment || undefined,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReport(updated);
        setFeedbackSuccessMessage(`Report review status updated to: ${status}`);
        setTimeout(() => setFeedbackSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;

    setIsSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: report.id,
          ai_prediction: {
            sif_potential: report.sif_potential,
            sif_score: report.sif_score,
            life_saving_rule: report.life_saving_rule,
            sif_precursor: report.sif_precursor,
            barrier_failure: report.barrier_failure,
          },
          hse_correction: {
            sif_potential: correctedSif,
            life_saving_rule: correctedRule,
            sif_precursor: correctedPrecursor,
            barrier_failure: correctedBarrier,
          },
          reviewer_comment: reviewComment,
          reviewer_name: 'HSE User',
        }),
      });

      if (res.ok) {
        // Refetch report to show calibrated data
        const repRes = await fetch(`/api/reports/${report.id}`);
        const updatedReport = await repRes.json();
        setReport(updatedReport);
        setShowCorrectionForm(false);
        setFeedbackSuccessMessage('HSE feedback submitted successfully and recorded for model retraining audit.');
        setTimeout(() => setFeedbackSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <AppShell
      title={`Report Investigation: ${reportId}`}
      subtitle="Comprehensive SIF assessment, evidence review, and human-in-the-loop sign-off."
    >
      {/* Back button */}
      <div>
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 text-xs font-medium text-content-muted hover:text-content-primary transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Reports</span>
        </Link>
      </div>

      {loading && <LoadingState message={`Fetching observation ${reportId}...`} />}

      {error && !loading && (
        <EmptyState
          title="Report Not Found"
          description={error}
          actionText="Return to Reports Explorer"
          onAction={() => router.push('/reports')}
        />
      )}

      {report && !loading && (
        <div className="space-y-6">
          {/* Top Header Card */}
          <div className="p-6 rounded-2xl bg-bg-primary border border-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-sm font-bold text-accent bg-bg-secondary px-2.5 py-1 rounded-lg border border-border">
                  {report.id}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-bg-secondary border border-border text-content-secondary font-medium">
                  {report.report_type}
                </span>
                <RiskBadge level={report.sif_potential} size="sm" />
                <span className="text-xs font-medium text-content-muted bg-bg-secondary px-2.5 py-1 rounded-lg border border-border">
                  Status: <strong className="text-content-primary">{report.review_status}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-content-muted pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  {report.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  {report.site}
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  {report.location}
                </span>
              </div>
            </div>

            {/* Quick Status Control Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickStatusUpdate('Reviewed')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sif-low-bg text-sif-low border border-sif-low/30 hover:bg-sif-low/20 text-xs font-semibold transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Accept Assessment</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickStatusUpdate('Escalated')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sif-high-bg text-sif-high border border-sif-high/30 hover:bg-sif-high/20 text-xs font-semibold transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Escalate to Asset Lead</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCorrectionForm(!showCorrectionForm)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated text-xs font-semibold text-content-primary transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-accent" />
                <span>{showCorrectionForm ? 'Hide Corrections' : 'Correct Assessment'}</span>
              </button>
            </div>
          </div>

          {feedbackSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-accent/15 border border-accent/30 text-xs text-accent font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>{feedbackSuccessMessage}</span>
            </div>
          )}

          {/* SIF Assessment Card */}
          <SifScoreCard
            potential={report.sif_potential}
            score={report.sif_score}
            explanation={report.explanation}
            reportId={report.id}
          />

          {/* Original Submitted Narrative */}
          <div className="p-5 rounded-2xl bg-bg-primary border border-border space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-content-muted flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span>Original Free-Text Report</span>
            </div>
            <p className="p-4 rounded-xl bg-bg-secondary/70 border border-border text-sm text-content-primary leading-relaxed font-sans">
              &ldquo;{report.report_text}&rdquo;
            </p>
          </div>

          {/* Structured Extraction Grid */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-content-muted">
              Structured Extraction Entities
            </div>
            <EntityGrid
              activity={report.activity}
              location={report.location}
              hazard={report.hazard}
              barrierFailure={report.barrier_failure}
              sifPrecursor={report.sif_precursor}
              lifeSavingRule={report.life_saving_rule}
            />
          </div>

          {/* Evidence Panel ("Why this was flagged") */}
          <EvidencePanel
            originalText={report.report_text}
            evidenceTokens={report.evidence}
            explanation={report.explanation}
          />

          {/* Corrective Actions Hierarchy */}
          <RecommendationCard actions={report.recommended_actions} />

          {/* HSE Review & Model Feedback Panel */}
          <div className="p-6 rounded-2xl bg-bg-primary border border-border shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                    HSE Professional Review & Feedback
                  </h3>
                  <p className="text-xs text-content-muted">
                    Human-in-the-loop validation: feedback logged here directly trains and calibrates the SIF classification engine.
                  </p>
                </div>
              </div>
            </div>

            {/* Reviewer Comment Area */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted">
                HSE Reviewer Remarks / Investigation Notes
              </label>
              <textarea
                rows={3}
                placeholder="Enter supervisory notes, root cause verification, or rationale for calibration..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-bg-secondary border border-border text-sm text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none leading-relaxed"
              />
            </div>

            {/* Optional Calibration Form */}
            {showCorrectionForm && (
              <form onSubmit={handleSaveFeedback} className="p-4 rounded-xl bg-bg-secondary border border-border space-y-4 animate-in fade-in duration-200">
                <div className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Calibrate Model Prediction Values</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-content-muted mb-1">
                      SIF Potential Classification
                    </label>
                    <select
                      value={correctedSif}
                      onChange={(e) => setCorrectedSif(e.target.value as SIFPotential)}
                      className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
                    >
                      <option value="HIGH">HIGH SIF</option>
                      <option value="MEDIUM">MEDIUM SIF</option>
                      <option value="LOW">LOW SIF</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-content-muted mb-1">
                      Life-Saving Rule Alignment
                    </label>
                    <select
                      value={correctedRule}
                      onChange={(e) => setCorrectedRule(e.target.value as LifeSavingRule)}
                      className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
                    >
                      {ALL_LIFE_SAVING_RULES.map((rule) => (
                        <option key={rule} value={rule}>
                          {rule}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-content-muted mb-1">
                      Calibrated SIF Precursor
                    </label>
                    <input
                      type="text"
                      value={correctedPrecursor}
                      onChange={(e) => setCorrectedPrecursor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-content-muted mb-1">
                      Calibrated Barrier Failure
                    </label>
                    <input
                      type="text"
                      value={correctedBarrier}
                      onChange={(e) => setCorrectedBarrier(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCorrectionForm(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-border bg-bg-primary text-xs font-medium text-content-muted hover:text-content-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors shadow-subtle"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save HSE Calibration</span>
                  </button>
                </div>
              </form>
            )}

            {!showCorrectionForm && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-content-muted">
                  HSE reviewers remain responsible for final incident categorization and corrective enforcement.
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickStatusUpdate('Reviewed')}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors shadow-subtle"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Save Review Notes</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
