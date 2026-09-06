import React from 'react';
import { SIFPotential } from '@/lib/types';
import { RiskBadge } from './RiskBadge';
import { ShieldAlert, Info } from 'lucide-react';

interface SifScoreCardProps {
  potential: SIFPotential;
  score: number;
  explanation: string;
  reportId?: string;
}

export function SifScoreCard({ potential, score, explanation, reportId }: SifScoreCardProps) {
  const percentage = Math.round(score * 100);

  const getMeterColor = () => {
    if (potential === 'HIGH') return 'bg-sif-high';
    if (potential === 'MEDIUM') return 'bg-sif-medium';
    if (potential === 'NON-SIF') return 'bg-accent';
    return 'bg-sif-low';
  };

  const getBorderColor = () => {
    if (potential === 'HIGH') return 'border-sif-high/40 shadow-card';
    if (potential === 'MEDIUM') return 'border-sif-medium/40';
    if (potential === 'NON-SIF') return 'border-accent/40';
    return 'border-sif-low/40';
  };

  return (
    <div className={`p-6 rounded-2xl bg-bg-primary border transition-all ${getBorderColor()}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-content-muted">
              SIF Assessment Result
            </span>
            {reportId && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-secondary border border-border text-content-secondary">
                {reportId}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <RiskBadge level={potential} size="lg" />
            <span className="text-xs text-content-muted">
              Threshold: {potential === 'HIGH' ? '≥ 0.75' : potential === 'MEDIUM' ? '0.45 – 0.74' : potential === 'LOW' ? '0.25 – 0.44' : '< 0.25 (Non-SIF)'}
            </span>
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="flex sm:flex-col sm:items-end justify-between items-center">
          <div className="text-xs text-content-muted">Confidence Score</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-bold text-content-primary">
              {percentage}%
            </span>
            <span className="text-xs font-mono text-content-muted">({score.toFixed(2)})</span>
          </div>
        </div>
      </div>

      {/* Progress Bar Meter */}
      <div className="py-4">
        <div className="flex items-center justify-between text-[11px] text-content-muted mb-1.5 font-mono">
          <span>0.00 (Low Risk)</span>
          <span>0.45 (Medium)</span>
          <span>0.75 (High SIF)</span>
          <span>1.00</span>
        </div>
        <div className="h-2.5 w-full bg-bg-secondary rounded-full overflow-hidden p-0.5 border border-border">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${getMeterColor()}`}
            style={{ width: `${Math.min(100, Math.max(8, percentage))}%` }}
          />
        </div>
      </div>

      {/* Human-Readable Risk Explanation */}
      <div className="mt-2 p-3.5 rounded-xl bg-bg-secondary/60 border border-border text-sm text-content-secondary leading-relaxed flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 text-accent mt-0.5" />
        <div>
          <div className="text-xs font-semibold text-content-primary mb-1 uppercase tracking-wider">
            Risk Analysis Summary
          </div>
          <p>{explanation}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-content-muted">
        <Info className="w-3.5 h-3.5 text-accent" />
        <span>Automated assessment based on contextual NLP analysis and barrier integrity.</span>
      </div>
    </div>
  );
}
