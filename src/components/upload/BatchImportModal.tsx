'use client';

import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Table,
  ArrowRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BatchIngestSummary } from '@/lib/types';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BatchImportModal({ isOpen, onClose, onSuccess }: BatchImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, any>[]>([]);
  const [totalDetected, setTotalDetected] = useState(0);

  // Column mapping states
  const [colText, setColText] = useState('report_text');
  const [colType, setColType] = useState('report_type');
  const [colSite, setColSite] = useState('site');
  const [colDate, setColDate] = useState('date');

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultSummary, setResultSummary] = useState<BatchIngestSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
      setResultSummary(null);

      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
          setErrorMessage('The uploaded spreadsheet contains no data rows.');
          return;
        }

        const keys = Object.keys(rows[0] || {});
        setColumns(keys);
        setPreviewRows(rows.slice(0, 3));
        setTotalDetected(rows.length);

        // Auto-detect columns intelligently
        const textKey = keys.find((k) => /text|narrative|desc|observation/i.test(k)) || keys[0] || 'report_text';
        const typeKey = keys.find((k) => /type|category/i.test(k)) || 'report_type';
        const siteKey = keys.find((k) => /site|location|facility|asset/i.test(k)) || 'site';
        const dateKey = keys.find((k) => /date|time|timestamp/i.test(k)) || 'date';

        setColText(textKey);
        setColType(typeKey);
        setColSite(siteKey);
        setColDate(dateKey);
      } catch (err) {
        console.error('Failed to parse spreadsheet preview:', err);
        setErrorMessage('Unable to read spreadsheet. Please ensure file is a valid .csv or .xlsx.');
      }
    }
  };

  const handleImportAndAnalyze = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setResultSummary(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('col_text', colText);
      formData.append('col_type', colType);
      formData.append('col_site', colSite);
      formData.append('col_date', colDate);

      const res = await fetch('/api/reports/batch', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Batch import failed');
      }

      const summary: BatchIngestSummary = await res.json();
      setResultSummary(summary);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Batch processing failed. Please check file format.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setColumns([]);
    setPreviewRows([]);
    setTotalDetected(0);
    setResultSummary(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isProcessing) onClose();
      }}
      title="Batch Safety Report Ingestion (CSV / XLSX)"
      subtitle="Import tabular observation datasets, map column fields, and run batch SIF precursor detection."
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {!selectedFile && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-8 border-2 border-dashed border-border hover:border-accent/40 bg-bg-secondary/40 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-accent mb-3 shadow-subtle">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-content-primary mb-1">
              Select CSV or Excel Spreadsheet
            </h4>
            <p className="text-xs text-content-muted max-w-xs mb-3">
              Supports .csv, .xlsx, or .xls files with safety observation logs.
            </p>
            <span className="px-3 py-1 rounded-lg bg-bg-elevated border border-border text-[11px] font-mono text-content-secondary">
              CSV or XLSX
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {selectedFile && !resultSummary && (
          <div className="space-y-4 animate-in fade-in">
            {/* File Info Bar */}
            <div className="p-3.5 rounded-xl bg-bg-secondary border border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold text-content-primary truncate">
                  {selectedFile.name}
                </span>
                <span className="text-[11px] font-mono text-content-muted">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                disabled={isProcessing}
                className="text-xs text-accent hover:underline"
              >
                Change File
              </button>
            </div>

            {/* Column Mapping Preview */}
            <div className="p-4 rounded-xl bg-bg-secondary border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-content-primary flex items-center gap-2">
                  <Table className="w-3.5 h-3.5 text-accent" />
                  <span>Map Spreadsheet Columns</span>
                </div>
                <span className="text-xs font-mono font-bold text-accent bg-bg-elevated px-2 py-0.5 rounded border border-border">
                  Detected {totalDetected} records
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-content-muted mb-1">
                    Report Narrative Text Column <strong className="text-sif-high">*</strong>
                  </label>
                  <select
                    value={colText}
                    onChange={(e) => setColText(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-bg-elevated border border-border text-xs text-content-primary focus:border-accent focus:outline-none font-mono"
                  >
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-content-muted mb-1">
                    Report Type Column (UA/UC/Near Miss)
                  </label>
                  <select
                    value={colType}
                    onChange={(e) => setColType(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-bg-elevated border border-border text-xs text-content-primary focus:border-accent focus:outline-none font-mono"
                  >
                    <option value="">-- Use Default (&ldquo;Near Miss&rdquo;) --</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-content-muted mb-1">
                    Site / Asset Facility Column
                  </label>
                  <select
                    value={colSite}
                    onChange={(e) => setColSite(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-bg-elevated border border-border text-xs text-content-primary focus:border-accent focus:outline-none font-mono"
                  >
                    <option value="">-- Use Default (&ldquo;Operational Facility&rdquo;) --</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-content-muted mb-1">
                    Date Column
                  </label>
                  <select
                    value={colDate}
                    onChange={(e) => setColDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-bg-elevated border border-border text-xs text-content-primary focus:border-accent focus:outline-none font-mono"
                  >
                    <option value="">-- Use Today&apos;s Date --</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sample Rows Preview */}
              {previewRows.length > 0 && (
                <div className="pt-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-content-muted mb-1">
                    Sample Data Preview:
                  </div>
                  <div className="p-2.5 rounded-lg bg-bg-elevated border border-border font-mono text-[11px] text-content-secondary line-clamp-2">
                    &ldquo;{String(previewRows[0][colText] || Object.values(previewRows[0])[0] || '').slice(0, 180)}...&rdquo;
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="p-6 rounded-xl bg-bg-secondary border border-accent/40 flex flex-col items-center justify-center text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <div className="text-xs font-bold text-content-primary">
              Processing {totalDetected} Safety Observations...
            </div>
            <p className="text-[11px] text-content-muted">
              Running NLP extraction, IOGP rule alignment, and calculating real precursor density.
            </p>
          </div>
        )}

        {/* Batch Ingestion Result Summary */}
        {resultSummary && (
          <div className="p-5 rounded-xl bg-bg-elevated border border-accent/40 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Actual Ingestion Results (Calculated From Uploaded Dataset)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg bg-bg-secondary border border-border">
                <span className="text-[10px] font-semibold uppercase text-content-muted block">
                  Uploaded
                </span>
                <span className="text-xl font-bold font-mono text-content-primary">
                  {resultSummary.totalUploaded}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-bg-secondary border border-border">
                <span className="text-[10px] font-semibold uppercase text-content-muted block">
                  Processed
                </span>
                <span className="text-xl font-bold font-mono text-content-primary">
                  {resultSummary.processed}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-bg-secondary border border-border">
                <span className="text-[10px] font-semibold uppercase text-sif-high block">
                  High SIF Flagged
                </span>
                <span className="text-xl font-bold font-mono text-sif-high">
                  {resultSummary.highSif}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-bg-secondary border border-border">
                <span className="text-[10px] font-semibold uppercase text-sif-medium block">
                  Medium SIF
                </span>
                <span className="text-xl font-bold font-mono text-sif-medium">
                  {resultSummary.mediumSif}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-content-muted">
              All {resultSummary.processed} reports have been persisted to the database and reflected across all analytical views.
            </p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-sif-high-bg border border-sif-high/40 text-xs text-sif-high flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="px-4 py-2 rounded-xl border border-border bg-bg-secondary text-xs font-medium text-content-muted hover:text-content-primary transition-colors"
          >
            {resultSummary ? 'Done' : 'Cancel'}
          </button>

          {selectedFile && !resultSummary && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleImportAndAnalyze}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-subtle"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import & Analyze {totalDetected} Records</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
