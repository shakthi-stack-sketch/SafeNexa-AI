'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface DensityItem {
  name: string;
  density: number; // 0 to 100%
  sifCount: number;
  totalCount: number;
}

interface PrecursorDensityBarChartProps {
  data?: DensityItem[];
  height?: number;
  onBarClick?: (item: DensityItem) => void;
}

const DEFAULT_DENSITY_DATA: DensityItem[] = [
  { name: 'Moran Tank Farm', density: 78, sifCount: 14, totalCount: 18 },
  { name: 'Naharkatiya Rig #4', density: 72, sifCount: 18, totalCount: 25 },
  { name: 'Digboi Field Area', density: 64, sifCount: 16, totalCount: 25 },
  { name: 'Tengakhat OCS', density: 52, sifCount: 11, totalCount: 21 },
  { name: 'Duliajan CPF', density: 44, sifCount: 12, totalCount: 27 },
  { name: 'Kumchai Gas Field', density: 31, sifCount: 5, totalCount: 16 },
];

export function PrecursorDensityBarChart({
  data = DEFAULT_DENSITY_DATA,
  height = 260,
  onBarClick,
}: PrecursorDensityBarChartProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border-color)"
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(val) => `${val}%`}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-color)' }}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            width={120}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-secondary)', opacity: 0.5 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as DensityItem;
                return (
                  <div className="p-3 rounded-xl bg-bg-elevated border border-border shadow-dropdown text-xs space-y-1">
                    <div className="font-semibold text-content-primary mb-1 border-b border-border pb-1">
                      {item.name}
                    </div>
                    <div className="flex items-center justify-between gap-4 text-accent">
                      <span>Precursor Density:</span>
                      <span className="font-bold">{item.density}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sif-high">
                      <span>SIF Potential:</span>
                      <span className="font-medium">{item.sifCount} reports</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-content-muted">
                      <span>Total Observations:</span>
                      <span>{item.totalCount} reports</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="density"
            radius={[0, 8, 8, 0]}
            cursor="pointer"
            onClick={(entry) => onBarClick && onBarClick(entry as DensityItem)}
          >
            {data.map((entry, index) => {
              const color =
                entry.density >= 70
                  ? '#C85C5C'
                  : entry.density >= 50
                  ? '#B58A4A'
                  : '#C7A76A';
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
