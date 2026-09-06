import React from 'react';
import {
  Activity,
  MapPin,
  AlertOctagon,
  ShieldX,
  Zap,
  BookmarkCheck,
  LucideIcon,
} from 'lucide-react';
import { LifeSavingRule } from '@/lib/types';

interface EntityItem {
  label: string;
  value: string;
  icon: LucideIcon;
  highlight?: boolean;
}

interface EntityGridProps {
  activity: string;
  location: string;
  hazard: string;
  barrierFailure: string;
  sifPrecursor: string;
  lifeSavingRule: LifeSavingRule;
}

export function EntityGrid({
  activity,
  location,
  hazard,
  barrierFailure,
  sifPrecursor,
  lifeSavingRule,
}: EntityGridProps) {
  const items: EntityItem[] = [
    {
      label: 'Life-Saving Rule',
      value: lifeSavingRule,
      icon: BookmarkCheck,
      highlight: true,
    },
    {
      label: 'SIF Precursor',
      value: sifPrecursor,
      icon: Zap,
      highlight: true,
    },
    {
      label: 'Barrier Failure',
      value: barrierFailure,
      icon: ShieldX,
    },
    {
      label: 'Identified Hazard',
      value: hazard,
      icon: AlertOctagon,
    },
    {
      label: 'Operational Activity',
      value: activity,
      icon: Activity,
    },
    {
      label: 'Asset Location',
      value: location,
      icon: MapPin,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border transition-all ${
              item.highlight
                ? 'bg-bg-elevated border-accent/30 shadow-subtle'
                : 'bg-bg-primary border-border'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-content-muted">
              <Icon
                className={`w-3.5 h-3.5 ${
                  item.highlight ? 'text-accent' : 'text-content-secondary'
                }`}
              />
              <span>{item.label}</span>
            </div>
            <div
              className={`text-sm font-medium leading-snug break-words ${
                item.highlight ? 'text-content-primary font-semibold' : 'text-content-secondary'
              }`}
            >
              {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
