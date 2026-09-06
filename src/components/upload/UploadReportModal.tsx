'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import {
  UploadCloud,
  FileText,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCode,
  Calendar,
  MapPin,
  Tag,
  ClipboardType,
} from 'lucide-react';
import { ReportType } from '@/lib/types';

interface UploadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (reportId: string) => void;
}

const PROGRESS_STAGES = [
  'Report file uploaded',
  'Text content extracted',
  'Safety context & energy analyzed',
  'SIF potential assessed',
  'Life-Saving Rule mapped',
  'Precursor identified & saved to database',
];

export function UploadReportModal({ isOpen, onClose, onSuccess }: UploadReportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [reportType, setReportType] = useState<ReportType>('Near Miss');
  const [site, setSite] = useState('Moran Tank Farm');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activity, setActivity] = useState('');

  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'txt'].includes(ext || '')) {
        setErrorMessage('Unsupported file format. Please upload a PDF, DOCX, or TXT document.');
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'txt'].includes(ext || '')) {
        setErrorMessage('Unsupported file format. Please upload a PDF, DOCX, or TXT document.');
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (inputMode === 'file' && !selectedFile) {
      setErrorMessage('Please select a PDF, DOCX, or TXT file to upload.');
      return;
    }
    if (inputMode === 'text' && !pastedText.trim()) {
      setErrorMessage('Please paste or type the safety observation narrative.');
      return;
    }

    setIsSubmitting(true);
    setCurrentStageIdx(0);

    // Dynamic progress step advancement
    const timer = setInterval(() => {
      setCurrentStageIdx((prev) => (prev < PROGRESS_STAGES.length - 1 ? prev + 1 : prev));
    }, 380);

    try {
      const formData = new FormData();
      if (inputMode === 'file' && selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('report_text', pastedText.trim());
      }
      formData.append('report_type', reportType);
      formData.append('site', site);
      formData.append('date', date);
      if (activity.trim()) {
        formData.append('activity', activity.trim());
      }

      const res = await fetch('/api/reports/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(timer);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Upload and text analysis failed');
      }

      const data = await res.json();
      setCurrentStageIdx(PROGRESS_STAGES.length);

      // Short delay so user sees final completed checkmark
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
        if (onSuccess) {
          onSuccess(data.report_id);
        } else {
          router.push(`/reports/${data.report_id}`);
        }
      }, 500);
    } catch (err: unknown) {
      clearInterval(timer);
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Upload failed. Please check the file and try again.';
      setErrorMessage(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title="Upload Safety Observation Report"
      subtitle="Extract text, analyze hazards & barrier failures, and classify SIF precursor potential into the database."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle Mode: File Upload vs Paste Text */}
        <div className="flex items-center justify-between p-1 bg-bg-secondary rounded-xl border border-border">
          <button
            type="button"
            onClick={() => {
              setInputMode('file');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              inputMode === 'file'
                ? 'bg-bg-elevated text-accent border border-accent/30 shadow-subtle'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            Upload File (PDF / DOCX / TXT)
          </button>
          <button
            type="button"
            onClick={() => {
              setInputMode('text');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              inputMode === 'text'
                ? 'bg-bg-elevated text-accent border border-accent/30 shadow-subtle'
                : 'text-content-muted hover:text-content-primary'
            }`}
          >
            Paste Report Text
          </button>
        </div>

        {/* Input Area */}
        {inputMode === 'file' ? (
          <div>
            {!selectedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:border-accent/40 bg-bg-secondary/40'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-accent mb-3 shadow-subtle">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-content-primary mb-1">
                  Upload your safety report
                </h4>
                <p className="text-xs text-content-muted max-w-xs mb-3 leading-relaxed">
                  Drag & drop your file here, or click to browse.
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-bg-elevated border border-border text-[11px] font-mono text-content-secondary">
                  PDF, DOCX or TXT
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-bg-secondary border border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-bg-elevated border border-accent/30 flex items-center justify-center text-accent shrink-0">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-content-primary truncate">
                      {selectedFile.name}
                    </div>
                    <div className="text-[11px] text-content-muted">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.name.split('.').pop()?.toUpperCase()}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg text-content-muted hover:text-sif-high hover:bg-bg-elevated transition-colors"
                  aria-label="Remove selected file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1.5">
              Paste Report Narrative
            </label>
            <textarea
              rows={4}
              placeholder="Paste or enter unsafe act, unsafe condition, near-miss or incident narrative text..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none leading-relaxed"
            />
          </div>
        )}

        {/* Metadata Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
            >
              <option value="Near Miss">Near Miss</option>
              <option value="Unsafe Act">Unsafe Act (UA)</option>
              <option value="Unsafe Condition">Unsafe Condition (UC)</option>
              <option value="Incident">Incident</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1">
              Site / Facility
            </label>
            <select
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
            >
              <option value="Moran Tank Farm">Moran Central Tank Farm</option>
              <option value="Naharkatiya Rig #4">Naharkatiya Rig #4</option>
              <option value="Duliajan CPF">Duliajan CPF</option>
              <option value="Digboi Field Area">Digboi Field Area</option>
              <option value="Tengakhat OCS">Tengakhat OCS</option>
              <option value="Jorhat Station">Jorhat Station</option>
              <option value="Kumchai Gas Field">Kumchai Gas Field</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Live Stepped Progress Indicator */}
        {isSubmitting && (
          <div className="p-4 rounded-xl bg-bg-secondary border border-accent/40 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-accent uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processing Report Through AI Pipeline
              </span>
              <span>
                {Math.min(100, Math.round(((currentStageIdx + 1) / PROGRESS_STAGES.length) * 100))}%
              </span>
            </div>

            <div className="space-y-1 pt-1">
              {PROGRESS_STAGES.map((stage, idx) => {
                const isCompleted = idx <= currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 text-xs transition-colors ${
                      isCompleted ? 'text-content-primary font-medium' : 'text-content-muted opacity-40'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
                    )}
                    <span>{stage}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-sif-high-bg border border-sif-high/40 text-xs text-sif-high flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border bg-bg-secondary text-xs font-medium text-content-muted hover:text-content-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (inputMode === 'file' ? !selectedFile : !pastedText.trim())}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-subtle"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Analyzing...' : 'Analyze Report'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
