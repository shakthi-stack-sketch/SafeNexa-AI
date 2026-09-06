'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { UploadReportModal } from '@/components/upload/UploadReportModal';
import { BatchImportModal } from '@/components/upload/BatchImportModal';
import {
  Search,
  Filter,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  RotateCcw,
  Inbox,
  Database,
} from 'lucide-react';
import { Report, SIFPotential, LifeSavingRule } from '@/lib/types';
import { ALL_LIFE_SAVING_RULES } from '@/lib/rules/iogp_rules';

function ReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [selectedSite, setSelectedSite] = useState(searchParams?.get('site') || '');
  const [selectedSif, setSelectedSif] = useState<string>(searchParams?.get('sif') || '');
  const [selectedRule, setSelectedRule] = useState<string>(searchParams?.get('rule') || '');
  const [selectedType, setSelectedType] = useState<string>(searchParams?.get('type') || '');
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams?.get('status') || '');
  const [selectedDate, setSelectedDate] = useState<string>(searchParams?.get('date') || '');

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'date' | 'sif_score' | 'id'>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const pageSize = 10;

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports?limit=200');
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
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
        await fetchReports();
      }
    } catch (err) {
      console.error('Failed to load demo:', err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  // Filtered & Sorted Reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          r.id.toLowerCase().includes(q) ||
          r.report_text.toLowerCase().includes(q) ||
          r.activity.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.hazard.toLowerCase().includes(q) ||
          r.life_saving_rule.toLowerCase().includes(q) ||
          r.sif_precursor.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedDate && r.date !== selectedDate) return false;
      if (selectedSite && r.site.toLowerCase() !== selectedSite.toLowerCase()) return false;
      if (selectedSif && r.sif_potential.toLowerCase() !== selectedSif.toLowerCase()) return false;
      if (selectedRule && r.life_saving_rule.toLowerCase() !== selectedRule.toLowerCase()) return false;
      if (selectedType && r.report_type.toLowerCase() !== selectedType.toLowerCase()) return false;
      if (selectedStatus && r.review_status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      return true;
    }).sort((a, b) => {
      if (sortField === 'sif_score') {
        return sortAsc ? a.sif_score - b.sif_score : b.sif_score - a.sif_score;
      }
      if (sortField === 'date') {
        return sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      }
      return sortAsc ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
    });
  }, [reports, searchQuery, selectedDate, selectedSite, selectedSif, selectedRule, selectedType, selectedStatus, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const paginatedReports = filteredReports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSite('');
    setSelectedSif('');
    setSelectedRule('');
    setSelectedType('');
    setSelectedStatus('');
    setSelectedDate('');
    setCurrentPage(1);
  };

  return (
    <AppShell
      title="Safety Reports Explorer"
      subtitle="Search, filter, review and batch-ingest safety observation reports across all assets."
    >
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by keywords, ID, activity, location, or precursor..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-primary border border-border text-sm text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBatchModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-bg-primary hover:bg-bg-elevated text-xs font-semibold text-content-primary transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-accent" />
            <span>Import CSV/XLSX</span>
          </button>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors shadow-subtle"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Upload Report</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon: Only render when reports exist */}
      {reports.length > 0 && (
        <div className="p-4 rounded-2xl bg-bg-primary border border-border shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-content-muted">
              <Filter className="w-3.5 h-3.5 text-accent" />
              <span>Database Filters</span>
              <span className="text-[11px] font-mono text-content-primary">
                ({filteredReports.length} records matching)
              </span>
            </div>
            {(selectedSite || selectedSif || selectedRule || selectedType || selectedStatus || selectedDate || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Date Filter */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              title="Filter by date"
              className="w-full px-2.5 py-1.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
            />

            {/* SIF Potential Filter */}
            <select
              value={selectedSif}
              onChange={(e) => {
                setSelectedSif(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
            >
              <option value="">SIF Potential: All</option>
              <option value="HIGH">HIGH SIF Only</option>
              <option value="MEDIUM">MEDIUM SIF Only</option>
              <option value="LOW">LOW SIF Only</option>
            </select>

            {/* Site Filter */}
            <select
              value={selectedSite}
              onChange={(e) => {
                setSelectedSite(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
            >
              <option value="">Asset: All Facilities</option>
              <option value="Moran Tank Farm">Moran Tank Farm</option>
              <option value="Naharkatiya Rig #4">Naharkatiya Rig #4</option>
              <option value="Duliajan CPF">Duliajan CPF</option>
              <option value="Digboi Field Area">Digboi Field Area</option>
              <option value="Tengakhat OCS">Tengakhat OCS</option>
              <option value="Jorhat Station">Jorhat Station</option>
            </select>

            {/* Life Saving Rule Filter */}
            <select
              value={selectedRule}
              onChange={(e) => {
                setSelectedRule(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
            >
              <option value="">IOGP Rule: All 9 Rules</option>
              {ALL_LIFE_SAVING_RULES.map((rule) => (
                <option key={rule} value={rule}>
                  {rule}
                </option>
              ))}
            </select>

            {/* Report Type */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
            >
              <option value="">Observation Type: All</option>
              <option value="Unsafe Act">Unsafe Act (UA)</option>
              <option value="Unsafe Condition">Unsafe Condition (UC)</option>
              <option value="Near Miss">Near Miss</option>
              <option value="Incident">Incident</option>
            </select>

            {/* Review Status */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl bg-bg-secondary border border-border text-xs text-content-primary focus:border-accent focus:outline-none"
            >
              <option value="">Review Status: All</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Escalated">Escalated</option>
              <option value="Corrected">Corrected</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState message="Loading reports register from database..." />
      ) : reports.length === 0 ? (
        /* Empty State: Zero reports in database */
        <div className="p-12 rounded-2xl bg-bg-primary border border-border text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center text-accent mx-auto shadow-subtle">
            <Inbox className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-content-primary mb-1">
              No Safety Reports Available
            </h3>
            <p className="text-xs text-content-muted leading-relaxed">
              Upload a safety report or import a dataset to begin AI-powered SIF analysis.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-[#14111A] font-bold text-xs hover:bg-accent-hover transition-colors shadow-subtle"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Upload Report</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated text-xs font-semibold text-content-primary transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-accent" />
              <span>Import CSV/XLSX</span>
            </button>
          </div>
        </div>
      ) : filteredReports.length === 0 ? (
        /* Empty State: Filters returned no match */
        <div className="p-12 rounded-2xl bg-bg-primary border border-border text-center">
          <p className="text-base font-bold text-content-primary mb-1">No matching reports found</p>
          <p className="text-xs text-content-muted mb-4">No reports in the database match your current filter parameters.</p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-accent text-[#14111A] text-xs font-bold hover:bg-accent-hover transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block p-5 rounded-2xl bg-bg-primary border border-border shadow-subtle overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-border text-content-muted uppercase tracking-wider text-[11px]">
                  <th
                    className="py-2.5 px-3 cursor-pointer hover:text-accent"
                    onClick={() => {
                      setSortField('id');
                      setSortAsc(!sortAsc);
                    }}
                  >
                    Report ID
                  </th>
                  <th
                    className="py-2.5 px-3 cursor-pointer hover:text-accent"
                    onClick={() => {
                      setSortField('date');
                      setSortAsc(!sortAsc);
                    }}
                  >
                    Date
                  </th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Site</th>
                  <th className="py-2.5 px-3">Activity</th>
                  <th className="py-2.5 px-3">Life-Saving Rule</th>
                  <th
                    className="py-2.5 px-3 cursor-pointer hover:text-accent"
                    onClick={() => {
                      setSortField('sif_score');
                      setSortAsc(!sortAsc);
                    }}
                  >
                    SIF Score
                  </th>
                  <th className="py-2.5 px-3">SIF Potential</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-bg-secondary hover:shadow-subtle hover:-translate-y-0.5 transition-all duration-150 cursor-pointer group"
                    onClick={() => router.push(`/reports/${report.id}`)}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-accent">
                      {report.id}
                    </td>
                    <td className="py-3 px-3 text-content-muted whitespace-nowrap">
                      {report.date}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-bg-secondary border border-border text-[11px] font-medium text-content-secondary">
                        {report.report_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-content-primary whitespace-nowrap">
                      {report.site}
                    </td>
                    <td className="py-3 px-3 text-content-secondary max-w-[160px] truncate">
                      {report.activity}
                    </td>
                    <td className="py-3 px-3 text-content-secondary whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-bg-secondary border border-border text-[11px]">
                        {report.life_saving_rule}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-content-primary font-semibold">
                      {Math.round(report.sif_score * 100)}%
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
                        <span>Investigate</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {paginatedReports.map((report) => (
              <div
                key={report.id}
                onClick={() => router.push(`/reports/${report.id}`)}
                className="p-4 rounded-2xl bg-bg-primary border border-border shadow-subtle space-y-3 cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs font-bold text-accent">
                      {report.id}
                    </div>
                    <div className="text-[11px] text-content-muted">
                      {report.date} • {report.site}
                    </div>
                  </div>
                  <RiskBadge level={report.sif_potential} size="sm" />
                </div>

                <p className="text-xs text-content-secondary line-clamp-2 leading-relaxed">
                  {report.report_text}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-bg-secondary border border-border text-content-secondary">
                    {report.life_saving_rule}
                  </span>
                  <span className="font-semibold text-accent flex items-center gap-1">
                    <span>Investigate</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="p-4 rounded-2xl bg-bg-primary border border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-content-muted">
            <div>
              Showing <strong className="text-content-primary">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
              <strong className="text-content-primary">
                {Math.min(currentPage * pageSize, filteredReports.length)}
              </strong>{' '}
              of <strong className="text-content-primary">{filteredReports.length}</strong> records
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-border bg-bg-secondary disabled:opacity-40 disabled:cursor-not-allowed hover:text-content-primary transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-mono text-content-primary">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl border border-border bg-bg-secondary disabled:opacity-40 disabled:cursor-not-allowed hover:text-content-primary transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Upload and Batch Modals */}
      <UploadReportModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => fetchReports()}
      />
      <BatchImportModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={() => fetchReports()}
      />
    </AppShell>
  );
}

export default function ReportsExplorerPage() {
  return (
    <Suspense fallback={<LoadingState message="Initializing reports explorer..." />}>
      <ReportsContent />
    </Suspense>
  );
}
