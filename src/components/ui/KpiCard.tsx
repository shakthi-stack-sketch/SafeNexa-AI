import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  badge?: string;
  highlight?: boolean;
  onClick?: () => void;
}

export function KpiCard({
  title,
  value,
  subtitle,
  change,
  trend = 'neutral',
  icon: Icon,
  badge,
  highlight = false,
  onClick,
}: KpiCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-2xl border transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:border-accent/40 active:translate-y-0 group' : ''
      } ${
        highlight
          ? 'bg-gradient-to-br from-bg-elevated to-bg-primary border-accent/40 shadow-card'
          : 'bg-bg-primary border-border hover:border-border/80 shadow-subtle'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-content-muted">
          {title}
        </span>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
            highlight
              ? 'bg-accent/15 border-accent/30 text-accent'
              : 'bg-bg-secondary border-border text-content-secondary'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl md:text-3xl font-bold tracking-tight text-content-primary">
          {value}
        </div>
        {badge && (
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border border-border bg-bg-secondary text-accent">
            {badge}
          </span>
        )}
      </div>

      {(change || subtitle) && (
        <div className="flex items-center gap-2 mt-2.5 text-xs text-content-muted">
          {change && (
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                trend === 'up'
                  ? 'text-sif-high'
                  : trend === 'down'
                  ? 'text-sif-low'
                  : 'text-content-secondary'
              }`}
            >
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {trend === 'neutral' && <Minus className="w-3 h-3" />}
              {change}
            </span>
          )}
          {subtitle && <span className="truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
