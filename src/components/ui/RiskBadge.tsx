import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SIFPotential } from '@/lib/types';

interface RiskBadgeProps {
  level: SIFPotential;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function RiskBadge({ level, size = 'md', showLabel = true }: RiskBadgeProps) {
  const configs = {
    HIGH: {
      label: 'HIGH SIF',
      badgeClass: 'bg-sif-high-bg text-sif-high border-sif-high/30',
      icon: AlertTriangle,
    },
    MEDIUM: {
      label: 'MEDIUM SIF',
      badgeClass: 'bg-sif-medium-bg text-sif-medium border-sif-medium/30',
      icon: AlertCircle,
    },
    LOW: {
      label: 'LOW SIF',
      badgeClass: 'bg-sif-low-bg text-sif-low border-sif-low/30',
      icon: CheckCircle2,
    },
    'NON-SIF': {
      label: 'NON-SIF',
      badgeClass: 'bg-accent/15 text-accent border-accent/30',
      icon: CheckCircle2,
    },
  };

  const config = configs[level] || configs.LOW;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border font-semibold uppercase tracking-wider ${config.badgeClass} ${sizeClasses[size]}`}
      role="status"
      aria-label={`Risk Level: ${level}`}
    >
      <Icon className={`${iconSizes[size]} shrink-0`} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
