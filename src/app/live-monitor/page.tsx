'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { WebcamSafetyMonitor } from '@/components/vision/WebcamSafetyMonitor';
import { TelemetryArchitectureDiagram } from '@/components/vision/TelemetryArchitectureDiagram';
import {
  ShieldAlert,
  Radio,
  FileText,
  Clock,
  CheckCircle2,
  ExternalLink,
  Sliders,
  Layers,
  Sparkles,
  ArrowRight,
  Inbox,
  AlertTriangle,
} from 'lucide-react';
import { Report } from '@/lib/types';

export default function SafetyMonitorPage() {
  const [visionReports, setVisionReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVisionObservations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports?limit=50');
      const data = await res.json();
      const allReports: Report[] = data.reports || [];
      const filtered = allReports.filter((r) => r.source === 'computer_vision');
      setVisionReports(filtered);
    } catch (err) {
      console.error('Failed to load vision observations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisionObservations();
  }, []);

  return (
    <AppShell
      title="Safety Monitor"
      subtitle="Live camera monitoring for workplace PPE compliance and safety alerts."
    >
      <div className="space-y-6">
        {/* Core Vision Viewport Component */}
        <WebcamSafetyMonitor onObservationCreated={() => loadVisionObservations()} />

        {/* Two Column Section: Recent Automated Observations & Live Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1 & 2: Recent Automated Observations */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-bg-primary border border-border shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-accent animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                    Automated Observation Log
                  </h3>
                  <p className="text-xs text-content-muted">
                    Safety observations automatically extracted by computer vision without manual typing.
                  </p>
                </div>
              </div>
              <Link
                href="/alert-center"
                className="text-xs font-bold text-accent hover:underline inline-flex items-center gap-1"
              >
                <span>Alert Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-content-muted">
                Loading automated vision records...
              </div>
            ) : visionReports.length === 0 ? (
              <div className="p-8 rounded-xl bg-bg-secondary border border-border text-center space-y-2">
                <Inbox className="w-8 h-8 text-content-muted mx-auto" />
                <p className="text-xs font-bold text-content-primary">No Vision Observations Recorded Yet</p>
                <p className="text-[11px] text-content-muted max-w-sm mx-auto leading-relaxed">
                  Start the camera or trigger a simulated scenario above to generate your first automated PPE observation.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {visionReports.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl bg-bg-secondary border border-border hover:border-accent/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-accent bg-bg-elevated px-2 py-0.5 rounded border border-border">
                          {r.id}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sif-high-bg text-sif-high border border-sif-high/30">
                          {r.sif_potential} SIF POTENTIAL
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                          Computer Vision
                        </span>
                        <span className="text-content-muted text-[11px]">{r.site}</span>
                      </div>
                      <p className="text-content-primary font-medium line-clamp-1">{r.report_text}</p>
                      <div className="flex items-center gap-3 text-[10px] text-content-muted">
                        <span>Precursor: {r.sif_precursor}</span>
                        <span>•</span>
                        <span>{new Date(r.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/reports/${r.id}`}
                        className="px-2.5 py-1.5 rounded-lg border border-border bg-bg-elevated text-content-secondary hover:text-accent text-[11px] font-medium inline-flex items-center gap-1"
                      >
                        <span>Investigate</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Col 3: Automation Summary & Safety Loop */}
          <div className="p-5 rounded-2xl bg-bg-primary border border-border shadow-subtle space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
                Automation Pipeline
              </h3>
              <p className="text-xs text-content-muted">
                Vision-to-Action feedback loop
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-bg-secondary border border-border space-y-1">
                <span className="text-[10px] uppercase font-bold text-accent block">Step 1: Automated Detection</span>
                <p className="text-content-secondary text-[11px] leading-relaxed">
                  Camera vision evaluates workers at 30 FPS for hardhats and safety vests.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-bg-secondary border border-border space-y-1">
                <span className="text-[10px] uppercase font-bold text-accent block">Step 2: SIF Engine Classification</span>
                <p className="text-content-secondary text-[11px] leading-relaxed">
                  Observation enters the existing NLP pipeline. High-energy hazards are flagged without manual typing.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-bg-secondary border border-border space-y-1">
                <span className="text-[10px] uppercase font-bold text-accent block">Step 3: Alert & Audible Siren</span>
                <p className="text-content-secondary text-[11px] leading-relaxed">
                  Dispatches high-priority event to Safety Alert Center, sounds local alarm, and notifies HSE.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-bg-secondary border border-border space-y-1">
                <span className="text-[10px] uppercase font-bold text-accent block">Step 4: Recurrence Clustering</span>
                <p className="text-content-secondary text-[11px] leading-relaxed">
                  Repeated violations in the same zone cluster into recognized Precursor Patterns.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/patterns"
                className="w-full py-2.5 px-3 rounded-xl border border-border bg-bg-secondary hover:bg-bg-elevated text-xs font-semibold text-content-primary transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Recurrence Patterns</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Monitored Safety Zones & Telemetry */}
        <TelemetryArchitectureDiagram />
      </div>
    </AppShell>
  );
}
