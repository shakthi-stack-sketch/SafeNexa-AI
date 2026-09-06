'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrendDataPoint {
  date: string;
  sifPotential: number;
  nonSif: number;
}

interface SifTrendChartProps {
  data?: TrendDataPoint[];
  height?: number;
}

export function SifTrendChart({ data = [], height = 260 }: SifTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-xl text-xs text-content-muted"
        style={{ height }}
      >
        <span className="font-semibold text-content-primary mb-1">Insufficient Data for Trend Analysis</span>
        <span className="text-[11px] opacity-75">Analyze additional safety reports to generate meaningful safety intelligence.</span>
      </div>
    );
  }
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="sifGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C85C5C" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#C85C5C" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="nonSifGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C7A76A" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#C7A76A" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border-color)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={{ stroke: 'var(--border-color)' }}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const sifVal = payload[0]?.value as number;
                const nonSifVal = payload[1]?.value as number;
                const total = sifVal + nonSifVal;
                const ratio = total > 0 ? Math.round((sifVal / total) * 100) : 0;
                return (
                  <div className="p-3 rounded-xl bg-bg-elevated border border-border shadow-dropdown text-xs space-y-1">
                    <div className="font-semibold text-content-primary mb-1 border-b border-border pb-1">
                      {label}
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sif-high">
                      <span>SIF Potential:</span>
                      <span className="font-bold">{sifVal}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-accent">
                      <span>Non-SIF Reports:</span>
                      <span className="font-bold">{nonSifVal}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-content-muted pt-1 border-t border-border">
                      <span>SIF Density:</span>
                      <span className="font-bold text-content-primary">{ratio}%</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="sifPotential"
            name="SIF Potential"
            stroke="#C85C5C"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#sifGradient)"
          />
          <Area
            type="monotone"
            dataKey="nonSif"
            name="Non-SIF Reports"
            stroke="#C7A76A"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#nonSifGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
