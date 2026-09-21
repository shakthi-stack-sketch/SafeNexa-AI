'use client';

import React from 'react';
import {
  Camera,
  Radio,
  Layers,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Eye,
  ShieldCheck,
  Flame,
  Activity,
} from 'lucide-react';

export function MonitoredZonesCard() {
  const zones = [
    {
      id: 'ZONE-01',
      name: 'Moran Tank Farm — Gantry Zone 1',
      type: 'Hydrocarbon Loading Gantry',
      status: 'Active Monitoring',
      channel: 'Camera Feed #01',
      focus: 'PPE Hardhat & High-Vis Vest Verification',
      riskTier: 'Tier 1 Critical',
      isActive: true,
    },
    {
      id: 'ZONE-02',
      name: 'Drill Rig 4 — Substructure Floor',
      type: 'Rig Rotary & Derrick Floor',
      status: 'Operational',
      channel: 'Camera Feed #02',
      focus: 'Red Zone Exclusion & Overhead Safety',
      riskTier: 'Tier 1 Critical',
      isActive: false,
    },
    {
      id: 'ZONE-03',
      name: 'Refinery Distillation Unit 2',
      type: 'Crude Column & Pump Bay',
      status: 'Operational',
      channel: 'Camera Feed #03',
      focus: 'Personnel Clearance & Thermal Protection',
      riskTier: 'Tier 2 High',
      isActive: false,
    },
    {
      id: 'ZONE-04',
      name: 'Gas Compression Station — Bay B',
      type: 'High-Pressure Compression',
      status: 'Operational',
      channel: 'Camera Feed #04',
      focus: 'Hot Work Watch & Barrier Compliance',
      riskTier: 'Tier 2 High',
      isActive: false,
    },
  ];

  return (
    <div className="p-5 rounded-2xl bg-bg-primary border border-border shadow-subtle space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <span>Monitored Safety Zones & Vision Telemetry</span>
          </h3>
          <p className="text-xs text-content-muted">
            Continuous optical safety surveillance across critical asset operating zones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry Online</span>
          </span>
        </div>
      </div>

      {/* Monitored Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className={`p-4 rounded-xl border transition-all space-y-2.5 ${
              zone.isActive
                ? 'bg-accent/5 border-accent/40 shadow-subtle'
                : 'bg-bg-secondary border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-content-muted">{zone.id}</span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  zone.isActive
                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                    : 'bg-bg-elevated text-content-muted border border-border'
                }`}
              >
                {zone.status}
              </span>
            </div>

            <div>
              <h4 className="font-bold text-content-primary text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="truncate">{zone.name}</span>
              </h4>
              <p className="text-[11px] text-content-muted mt-0.5">{zone.type}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-bg-primary/80 border border-border space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-content-muted">
                <span>Channel</span>
                <span className="font-mono text-content-primary font-medium">{zone.channel}</span>
              </div>
              <div className="text-content-secondary leading-snug pt-0.5">
                {zone.focus}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[10px]">
              <span className="text-content-muted font-mono">{zone.riskTier}</span>
              <span className="text-accent flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>30 FPS</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Automated Vision Pipeline Flow */}
      <div className="p-4 rounded-xl bg-bg-secondary border border-border space-y-2.5">
        <span className="text-[10px] uppercase font-bold tracking-wider text-content-muted block">
          End-to-End Safety Pipeline
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-content-primary">
          <span className="px-2.5 py-1 rounded bg-bg-elevated border border-border text-accent font-bold flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Feed</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-content-muted" />
          <span className="px-2.5 py-1 rounded bg-bg-elevated border border-border text-content-primary flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-accent" />
            <span>Vision Inference</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-content-muted" />
          <span className="px-2.5 py-1 rounded bg-bg-elevated border border-border text-content-primary flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-accent" />
            <span>SafeNexa SIF Engine</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-content-muted" />
          <span className="px-2.5 py-1 rounded bg-bg-elevated border border-border text-content-primary flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Safety Alert Center</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-content-muted" />
          <span className="px-2.5 py-1 rounded bg-bg-elevated border border-border text-sif-high font-bold flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            <span>Audible Alert & Workflows</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// Export under both names for backwards compatibility
export const TelemetryArchitectureDiagram = MonitoredZonesCard;
