'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingState } from '@/components/ui/LoadingState';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Modal } from '@/components/ui/Modal';
import {
  MessageSquareDiff,
  Download,
  ExternalLink,
  CheckCircle2,
  Calendar,
  UserCheck,
  ShieldCheck,
  Database,
  PlusCircle,
} from 'lucide-react';
import { HSEFeedback } from '@/lib/types';

export default function FeedbackAuditPage() {
  const [loading, setLoading] = useState(true);
  const [feedbackList, setFeedbackList] = useState<HSEFeedback[]>([]);

  // Feedback Submission Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportIdInput, setReportIdInput] = useState('');
  const [accuracyInput, setAccuracyInput] = useState<'Correct' | 'Partially Correct' | 'Incorrect'>('Correct');
  const [commentsInput, setCommentsInput] = useState('');
  const [reviewerNameInput, setReviewerNameInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [availableReports, setAvailableReports] = useState<{ id: string; activity: string }[]>([]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/feedback');
      const data = await res.json();
      setFeedbackList(data.feedback || []);
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const openFeedbackModal = async () => {
    setIsModalOpen(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/reports?limit=50');
      const data = await res.json();
      if (data.reports && data.reports.length > 0) {
        setAvailableReports(data.reports.map((r: any) => ({ id: r.id, activity: r.activity })));
        if (!reportIdInput) {
          setReportIdInput(data.reports[0].id);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: reportIdInput || 'GENERAL-OBSERVATION',
          accuracy: accuracyInput,
          comments: commentsInput,
          reviewer_name: reviewerNameInput || 'HSE Auditor',
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to save feedback');
      }
      setIsModalOpen(false);
      setCommentsInput('');
      await fetchFeedback();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to record feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportRetrainingData = () => {
    const formatted = feedbackList.map((f) => ({
      report_id: f.report_id,
      timestamp: f.created_at,
      input_text: `Safety Observation Report ${f.report_id}`,
      predicted_label: f.ai_prediction.sif_potential,
      ground_truth_label: f.hse_correction.sif_potential,
      predicted_rule: f.ai_prediction.life_saving_rule,
      ground_truth_rule: f.hse_correction.life_saving_rule,
      corrected_precursor: f.hse_correction.sif_precursor,
      reviewer_rationale: f.reviewer_comment,
    }));

    const blob = new Blob([JSON.stringify(formatted, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oil_sif_human_feedback_retraining_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="Human-in-the-Loop Model Governance"
      subtitle="Audit trail of HSE professional corrections and calibrations supporting continuous model retraining."
    >
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-bg-primary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-content-primary">
              Active Retraining Corpus: {feedbackList.length} Human-Validated Records
            </h3>
            <p className="text-xs text-content-muted">
              Every supervisor review creates an immutable delta log for fine-tuning the DeBERTa-v3 NLP engine.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openFeedbackModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors shadow-subtle"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Analysis Feedback</span>
          </button>
          <button
            type="button"
            onClick={handleExportRetrainingData}
            disabled={feedbackList.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated text-content-primary disabled:opacity-50 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-accent" />
            <span>Export Dataset (JSON)</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Fetching human-in-the-loop audit logs..." />
      ) : feedbackList.length === 0 ? (
        <div className="p-12 rounded-2xl bg-bg-primary border border-border text-center">
          <p className="text-base font-bold text-content-primary mb-1">No human corrections recorded yet</p>
          <p className="text-xs text-content-muted mb-4">
            To calibrate the model, submit feedback directly or open any report in Report Details to correct an assessment.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={openFeedbackModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-[#14111A] text-xs font-bold hover:bg-accent-hover transition-colors shadow-subtle"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Analysis Feedback</span>
            </button>
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-bg-secondary text-content-primary hover:bg-bg-elevated text-xs font-semibold transition-colors"
            >
              Explore Reports
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbackList.map((item) => {
            const hasSifChanged = item.ai_prediction.sif_potential !== item.hse_correction.sif_potential;
            const hasRuleChanged = item.ai_prediction.life_saving_rule !== item.hse_correction.life_saving_rule;

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-bg-primary border border-border shadow-subtle space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-accent bg-bg-secondary px-2.5 py-1 rounded-lg border border-border">
                      {item.id}
                    </span>
                    <Link
                      href={`/reports/${item.report_id}`}
                      className="inline-flex items-center gap-1 font-mono text-xs text-content-primary hover:text-accent font-semibold transition-colors"
                    >
                      <span>Report {item.report_id}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-content-muted">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-accent" />
                      {item.reviewer_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* AI vs Human Delta Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* AI Prediction */}
                  <div className="p-3.5 rounded-xl bg-bg-secondary border border-border space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">
                      Initial AI Prediction
                    </span>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={item.ai_prediction.sif_potential} size="sm" />
                      <span className="text-xs text-content-muted">
                        Score: {item.ai_prediction.sif_score}
                      </span>
                    </div>
                    <div className="text-content-secondary">
                      <strong>Rule:</strong> {item.ai_prediction.life_saving_rule}
                    </div>
                    <div className="text-content-muted truncate">
                      <strong>Precursor:</strong> {item.ai_prediction.sif_precursor}
                    </div>
                  </div>

                  {/* Human HSE Correction */}
                  <div className="p-3.5 rounded-xl bg-bg-elevated border border-accent/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
                        HSE Professional Sign-off
                      </span>
                      {(hasSifChanged || hasRuleChanged) && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-sif-high-bg text-sif-high border border-sif-high/30">
                          Calibrated
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={item.hse_correction.sif_potential} size="sm" />
                      {hasSifChanged && (
                        <span className="text-[11px] text-accent font-semibold">
                          (Reclassified from {item.ai_prediction.sif_potential})
                        </span>
                      )}
                    </div>
                    <div className="text-content-primary">
                      <strong>Rule:</strong> {item.hse_correction.life_saving_rule}
                    </div>
                    <div className="text-content-secondary truncate">
                      <strong>Precursor:</strong> {item.hse_correction.sif_precursor}
                    </div>
                  </div>
                </div>

                {/* Reviewer Comment */}
                {item.reviewer_comment && (
                  <div className="p-3.5 rounded-xl bg-bg-secondary/60 border border-border text-xs text-content-secondary">
                    <span className="font-semibold text-content-primary block mb-1 uppercase tracking-wider text-[10px]">
                      HSE Expert Rationale
                    </span>
                    <p className="leading-relaxed">&ldquo;{item.reviewer_comment}&rdquo;</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Analysis Feedback Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Analysis Feedback"
        subtitle="Calibrate the AI Safety & SIF engine with expert safety observations"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
          {submitError && (
            <div className="p-3 rounded-xl bg-sif-high-bg border border-sif-high/30 text-sif-high">
              {submitError}
            </div>
          )}

          <div>
            <label className="block text-content-muted font-semibold uppercase tracking-wider text-[10px] mb-1.5">
              Associated Safety Report (Optional)
            </label>
            {availableReports.length > 0 ? (
              <select
                value={reportIdInput}
                onChange={(e) => setReportIdInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
              >
                <option value="">-- General Platform Feedback --</option>
                {availableReports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} — {r.activity}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={reportIdInput}
                onChange={(e) => setReportIdInput(e.target.value)}
                placeholder="e.g. R-1001 or General"
                className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-content-muted font-semibold uppercase tracking-wider text-[10px] mb-1.5">
              AI Analysis Accuracy
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Correct', 'Partially Correct', 'Incorrect'] as const).map((acc) => (
                <button
                  type="button"
                  key={acc}
                  onClick={() => setAccuracyInput(acc)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    accuracyInput === acc
                      ? acc === 'Correct'
                        ? 'bg-sif-low-bg text-sif-low border-sif-low/40 shadow-subtle'
                        : acc === 'Partially Correct'
                        ? 'bg-sif-medium-bg text-sif-medium border-sif-medium/40 shadow-subtle'
                        : 'bg-sif-high-bg text-sif-high border-sif-high/40 shadow-subtle'
                      : 'bg-bg-secondary border-border text-content-muted hover:text-content-primary'
                  }`}
                >
                  {acc}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-content-muted font-semibold uppercase tracking-wider text-[10px] mb-1.5">
              Reviewer Name / Title (Optional)
            </label>
            <input
              type="text"
              value={reviewerNameInput}
              onChange={(e) => setReviewerNameInput(e.target.value)}
              placeholder="e.g. Senior HSE Specialist"
              className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-content-muted font-semibold uppercase tracking-wider text-[10px] mb-1.5">
              Expert Feedback & Comments
            </label>
            <textarea
              required
              rows={3}
              value={commentsInput}
              onChange={(e) => setCommentsInput(e.target.value)}
              placeholder="Describe why the classification was accurate or what nuance the NLP model missed..."
              className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-border bg-bg-secondary text-content-secondary hover:text-content-primary text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !commentsInput.trim()}
              className="px-4 py-2 rounded-xl bg-accent text-[#14111A] text-xs font-bold hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-subtle"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
