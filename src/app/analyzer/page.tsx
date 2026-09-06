'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { SifScoreCard } from '@/components/ui/SifScoreCard';
import { EntityGrid } from '@/components/ui/EntityCard';
import { EvidencePanel } from '@/components/ui/EvidencePanel';
import { RecommendationCard } from '@/components/ui/RecommendationCard';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  Sparkles,
  RotateCcw,
  Send,
  BookOpen,
  ArrowRight,
  Download,
  Check,
  UploadCloud,
  FileText,
  AlertTriangle,
  XCircle,
  File,
  X,
} from 'lucide-react';
import { ReportType } from '@/lib/types';
import { AnalysisResult } from '@/lib/nlp/engine';

// Preset realistic test incidents
const SAMPLE_PRESETS = [
  {
    title: 'Confined Space Omission (High SIF)',
    type: 'Near Miss' as ReportType,
    site: 'Moran Central Tank Farm',
    department: 'Process Operations',
    text: 'During maintenance inside a crude oil separator vessel at Moran Central Tank Farm, two contract technicians entered without atmospheric gas testing. No multi-gas detector was deployed at the manway prior to entry, and the vessel was not positively isolated from the live production manifold.',
  },
  {
    title: 'Suspended Load Near Personnel (High SIF)',
    type: 'Unsafe Act' as ReportType,
    site: 'Naharkatiya Rig #4',
    department: 'Drilling Division',
    text: 'Rigger observed standing directly underneath a 6.8-ton drill collar suspended load during crane transfer to the pipe rack at Naharkatiya Rig #4. Tagline was not used to guide the load, and the exclusion drop-zone was not barricaded.',
  },
  {
    title: 'Working at Height Without Tie-Off (High SIF)',
    type: 'Unsafe Condition' as ReportType,
    site: 'Digboi Field Area',
    department: 'Asset Maintenance',
    text: 'Technician working at an elevated pipe rack platform at height of 8.5 meters at Digboi Field Area without safety harness tie-off. The scaffolding had no top guardrail on the north edge and the green scafftag was expired by 12 days.',
  },
  {
    title: 'Minor Housekeeping Observation (Non-SIF / Low)',
    type: 'Unsafe Condition' as ReportType,
    site: 'Duliajan CPF',
    department: 'Warehouse & Logistics',
    text: 'Minor housekeeping clutter was observed near a storage area without exposure to hazardous energy or serious injury potential. Empty wooden pallets and discarded plastic strapping were left across the walkway.',
  },
  {
    title: 'Pressurized Flange Maintenance (High SIF)',
    type: 'Near Miss' as ReportType,
    site: 'Jorhat Compressor Station',
    department: 'Mechanical Integrity',
    text: 'Maintenance crew attempted to replace a pressure relief valve on booster discharge line while line was still pressurized at 45 bar. Bleeder valve was seized and technician attempted to loosen bonnet bolts before verifying zero pressure or applying LOTO.',
  },
];

// Required meaningful loading states
const ANALYSIS_STEPS = [
  'Validating report...',
  'Extracting report content...',
  'Checking safety relevance...',
  'Analyzing safety information...',
  'Identifying SIF precursors...',
  'Mapping Life-Saving Rules...',
  'Generating safety assessment...',
];

export default function ReportAnalyzerPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Input Mode: Manual Text vs File Upload
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportText, setReportText] = useState('');

  // Optional Metadata
  const [reportType, setReportType] = useState<ReportType>('Near Miss');
  const [site, setSite] = useState('Moran Central Tank Farm');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('');
  const [activity, setActivity] = useState('');

  // State
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInvalidSafetyReport, setIsInvalidSafetyReport] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setInputMode('text');
    setSelectedFile(null);
    setReportText(preset.text);
    setReportType(preset.type);
    setSite(preset.site);
    setDepartment(preset.department);
    setError(null);
    setIsInvalidSafetyReport(false);
    setResult(null);
    setSavedSuccess(false);
  };

  const handleClear = () => {
    setReportText('');
    setSelectedFile(null);
    setActivity('');
    setDepartment('');
    setResult(null);
    setError(null);
    setIsInvalidSafetyReport(false);
    setSavedSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'txt'].includes(ext || '')) {
        setError('This file format is not supported. Supported formats: PDF, DOCX, TXT.');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setIsInvalidSafetyReport(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'txt'].includes(ext || '')) {
        setError('This file format is not supported. Supported formats: PDF, DOCX, TXT.');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setIsInvalidSafetyReport(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsInvalidSafetyReport(false);
    setResult(null);
    setSavedSuccess(false);

    if (inputMode === 'text' && !reportText.trim()) {
      setError('Please provide report narrative text before submitting analysis.');
      return;
    }

    if (inputMode === 'file' && !selectedFile) {
      setError('Please select a PDF, DOCX, or TXT file to upload.');
      return;
    }

    setLoading(true);

    // Progressive step indicator cycling through exact required states
    let stepIndex = 0;
    setCurrentStep(ANALYSIS_STEPS[0]);
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < ANALYSIS_STEPS.length) {
        setCurrentStep(ANALYSIS_STEPS[stepIndex]);
      }
    }, 280);

    try {
      let response: Response;

      if (inputMode === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('report_type', reportType);
        formData.append('site', site);
        formData.append('date', date);
        if (activity.trim()) formData.append('activity', activity.trim());

        response = await fetch('/api/reports/upload', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('/api/reports/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            report_text: reportText,
            report_type: reportType,
            site,
            date,
            activity: activity.trim() || undefined,
            auto_save: true,
          }),
        });
      }

      clearInterval(interval);

      const data = await response.json();

      if (!response.ok) {
        // Check for Invalid Safety Report rejection
        if (response.status === 422 || data.error === 'Invalid Safety Report') {
          setIsInvalidSafetyReport(true);
          setError(
            data.message ||
            data.error ||
            'The submitted content does not appear to describe an HSE or safety observation. Please upload a safety report, unsafe act, unsafe condition, near miss, or incident.'
          );
        } else {
          setError(data.error || 'Analysis could not be completed. Please try again.');
        }
        return;
      }

      // Valid safety report analyzed successfully
      const analysisOutput = data.analysis || data;
      setResult(analysisOutput);
      setSavedSuccess(true);
    } catch (err: unknown) {
      clearInterval(interval);
      console.error(err);
      setError('Analysis failure. Please verify input and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.report_id}_analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="AI Safety Report Analyzer"
      subtitle="Accurate NLP analysis and SIF precursor identification for genuine HSE observations."
    >
      {/* Top Presets Bar */}
      <div className="p-4 rounded-2xl bg-bg-primary border border-border">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">
          <BookOpen className="w-3.5 h-3.5 text-accent" />
          <span>Quick Preset Incidents (Oil Operations)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadPreset(preset)}
              className="px-3 py-1.5 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated hover:border-accent/40 text-xs text-content-secondary hover:text-content-primary transition-all duration-150 text-left"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Analysis Input Form */}
      <div className="p-6 rounded-2xl bg-bg-primary border border-border shadow-subtle">
        {/* Input Mode Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-4 mb-5">
          <button
            type="button"
            onClick={() => {
              setInputMode('text');
              setError(null);
              setIsInvalidSafetyReport(false);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
              inputMode === 'text'
                ? 'bg-accent/15 text-accent border border-accent/40 shadow-subtle'
                : 'text-content-muted hover:text-content-primary hover:bg-bg-secondary'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Manual Input (Paste Text)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInputMode('file');
              setError(null);
              setIsInvalidSafetyReport(false);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
              inputMode === 'file'
                ? 'bg-accent/15 text-accent border border-accent/40 shadow-subtle'
                : 'text-content-muted hover:text-content-primary hover:bg-bg-secondary'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>File Upload (PDF, DOCX, TXT)</span>
          </button>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-4">
          {/* Metadata Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-content-muted mb-1.5">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none transition-colors"
              >
                <option value="Near Miss">Near Miss</option>
                <option value="Unsafe Act">Unsafe Act</option>
                <option value="Unsafe Condition">Unsafe Condition</option>
                <option value="Incident">Incident</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-content-muted mb-1.5">
                Site / Facility
              </label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none transition-colors"
              >
                <option value="Moran Central Tank Farm">Moran Central Tank Farm</option>
                <option value="Naharkatiya Rig #4">Naharkatiya Rig #4</option>
                <option value="Duliajan CPF">Duliajan CPF</option>
                <option value="Digboi Field Area">Digboi Field Area</option>
                <option value="Tengakhat OCS">Tengakhat OCS</option>
                <option value="Jorhat Compressor Station">Jorhat Compressor Station</option>
                <option value="Kumchai Gas Field">Kumchai Gas Field</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-content-muted mb-1.5">
                Observation Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-content-muted mb-1.5">
                Department (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Drilling, Operations"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-content-muted mb-1.5">
                Activity (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Scaffolding, Tank Entry"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Mode 1: Textarea for Manual Paste */}
          {inputMode === 'text' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Free-Text Safety Report Narrative
                </label>
                <span className="text-[11px] text-content-muted">
                  {reportText.length} characters
                </span>
              </div>
              <textarea
                rows={5}
                placeholder="Paste or enter an unsafe act, unsafe condition, near-miss or incident report narrative..."
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                className="w-full p-4 rounded-xl bg-bg-secondary border border-border text-sm text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none leading-relaxed transition-colors"
              />
            </div>
          )}

          {/* Mode 2: File Upload Zone */}
          {inputMode === 'file' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-150 ${
                    isDragOver
                      ? 'border-accent bg-accent/10'
                      : 'border-border bg-bg-secondary hover:border-accent/50 hover:bg-bg-elevated'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-bg-primary border border-border flex items-center justify-center text-accent mx-auto mb-3 shadow-subtle">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-content-primary mb-1">
                    Drag and drop safety report document here
                  </p>
                  <p className="text-xs text-content-muted mb-3">
                    Supports official PDF, Word DOCX, and Plain Text TXT reports
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-bg-primary text-xs font-semibold text-content-primary">
                    Browse Local File
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-bg-secondary border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                      <File className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-content-primary truncate">
                        {selectedFile.name}
                      </div>
                      <div className="text-[11px] text-content-muted">
                        {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.name.split('.').pop()?.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1.5 rounded-lg text-content-muted hover:text-sif-high hover:bg-sif-high/10 transition-colors"
                    aria-label="Remove File"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Distinct Invalid Safety Report Error Card */}
          {isInvalidSafetyReport && error && (
            <div className="p-5 rounded-2xl bg-sif-high-bg border border-sif-high/40 text-content-primary space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-sif-high font-bold text-sm">
                <XCircle className="w-5 h-5 shrink-0" />
                <span>Invalid Safety Report</span>
              </div>
              <p className="text-xs text-content-primary leading-relaxed font-medium">
                {error}
              </p>
              <div className="text-[11px] text-content-muted pt-2 border-t border-border/60">
                <strong>Safety Validation Rule:</strong> Content unrelated to safety (such as academic assignments, task reminders, shopping lists, code snippets, or casual notes) cannot be evaluated for SIF potential.
              </div>
            </div>
          )}

          {/* Generic Error */}
          {!isInvalidSafetyReport && error && (
            <div className="p-3.5 rounded-xl bg-sif-high-bg border border-sif-high/40 text-xs text-sif-high font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated text-xs font-medium text-content-secondary hover:text-content-primary transition-all duration-150"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              type="submit"
              disabled={loading || (inputMode === 'text' ? !reportText.trim() : !selectedFile)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-subtle hover:-translate-y-0.5 active:translate-y-0.5"
            >
              <Send className="w-4 h-4" />
              <span>Analyze Report</span>
            </button>
          </div>
        </form>
      </div>

      {/* Stepped Progressive Loading State */}
      {loading && (
        <LoadingState
          message="Executing AI/NLP Multi-Stage Safety Pipeline..."
          stepMessage={currentStep}
        />
      )}

      {/* Analysis Result Output (Only rendered for valid safety reports) */}
      {result && !loading && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Success Banner */}
          {savedSuccess && (
            <div className="p-4 rounded-2xl bg-accent/15 border border-accent/30 text-xs text-accent font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 shrink-0" />
                <span>
                  Valid safety report verified & recorded to database as <strong>{result.report_id}</strong>.
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1 hover:underline text-[11px] text-content-primary font-medium"
                >
                  <Download className="w-3 h-3" />
                  <span>Export JSON</span>
                </button>
                <Link
                  href={`/reports/${result.report_id}`}
                  className="inline-flex items-center gap-1 font-bold underline text-[11px] text-accent hover:text-accent-hover"
                >
                  <span>Open Report & Review</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Section 1: SIF Assessment Card */}
          <SifScoreCard
            potential={result.sif_potential}
            score={result.sif_score}
            explanation={result.explanation}
            reportId={result.report_id}
          />

          {/* Section 2: Structured Entity Extraction Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-content-muted">
                Extracted Safety & Barrier Intelligence
              </span>
            </div>
            <EntityGrid
              activity={result.activity}
              location={result.location}
              hazard={result.hazard}
              barrierFailure={result.barrier_failure}
              lifeSavingRule={result.life_saving_rule}
              sifPrecursor={result.sif_precursor}
            />
          </div>

          {/* Section 3: Grounded Evidence Spans */}
          {result.evidence && result.evidence.length > 0 && (
            <EvidencePanel
              originalText={reportText}
              evidenceTokens={result.evidence}
              explanation={result.explanation}
            />
          )}

          {/* Section 4: Recommended Corrective Actions */}
          <RecommendationCard actions={result.recommended_actions} />
        </div>
      )}
    </AppShell>
  );
}
