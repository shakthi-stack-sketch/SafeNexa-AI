import React from 'react';
import { CorrectiveAction } from '@/lib/types';
import { ShieldCheck, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';

interface RecommendationCardProps {
  actions: CorrectiveAction;
}

export function RecommendationCard({ actions }: RecommendationCardProps) {
  const sections = [
    {
      title: 'Immediate Containment',
      badge: 'Immediate',
      badgeColor: 'bg-sif-high-bg text-sif-high border-sif-high/30',
      icon: AlertCircle,
      items: actions.immediate,
      subtitle: 'Stop or quarantine unsafe conditions immediately',
    },
    {
      title: 'Safety Barrier Restoration',
      badge: 'Control',
      badgeColor: 'bg-accent/15 text-accent border-accent/30',
      icon: ShieldCheck,
      items: actions.control,
      subtitle: 'Reinstate engineering & procedural safeguards',
    },
    {
      title: 'Pre-Restart Verification',
      badge: 'Verification',
      badgeColor: 'bg-sif-medium-bg text-sif-medium border-sif-medium/30',
      icon: CheckCircle2,
      items: actions.verification,
      subtitle: 'Independent physical checks before resuming work',
    },
    {
      title: 'Systemic Prevention & Audit',
      badge: 'Preventive',
      badgeColor: 'bg-sif-low-bg text-sif-low border-sif-low/30',
      icon: RotateCcw,
      items: actions.preventive,
      subtitle: 'Procedure, competence, and cross-asset audits',
    },
  ];

  return (
    <div className="p-5 rounded-2xl bg-bg-primary border border-border space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-content-primary">
            Grounded Corrective Actions
          </h3>
          <p className="text-xs text-content-muted">
            Targeted hierarchy of controls grounded in the identified barrier breakdown.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-bg-secondary border border-border flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold text-content-primary">
                      {section.title}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${section.badgeColor}`}
                  >
                    {section.badge}
                  </span>
                </div>
                <p className="text-[11px] text-content-muted mb-3">
                  {section.subtitle}
                </p>

                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-xs text-content-secondary flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
