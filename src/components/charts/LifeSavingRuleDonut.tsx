'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { LifeSavingRule } from '@/lib/types';

interface RuleDistributionItem {
  rule: LifeSavingRule;
  count: number;
}

interface LifeSavingRuleDonutProps {
  data?: RuleDistributionItem[];
  height?: number;
  onSelectRule?: (rule: LifeSavingRule) => void;
}

const DEFAULT_RULE_DATA: RuleDistributionItem[] = [
  { rule: 'Working at Height', count: 18 },
  { rule: 'Safe Mechanical Lifting', count: 16 },
  { rule: 'Confined Space', count: 14 },
  { rule: 'Energy Isolation', count: 12 },
  { rule: 'Hot Work', count: 11 },
  { rule: 'Line of Fire', count: 9 },
  { rule: 'Bypassing Safety Controls', count: 7 },
  { rule: 'Work Authorisation', count: 6 },
  { rule: 'Driving', count: 5 },
];

const COLORS = [
  '#C7A76A', // Champagne gold
  '#C85C5C', // SIF High
  '#B58A4A', // SIF Medium
  '#9B8053', // Muted Bronze
  '#66856F', // SIF Low
  '#D8BA7E', // Soft Gold
  '#A05252', // Deep Red
  '#7A6A4E', // Earth Bronze
  '#8A9A86', // Sage
];

export function LifeSavingRuleDonut({
  data = DEFAULT_RULE_DATA,
  height = 260,
  onSelectRule,
}: LifeSavingRuleDonutProps) {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4" style={{ minHeight: height }}>
      <div className="w-full md:w-1/2 h-[220px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as RuleDistributionItem;
                  const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  return (
                    <div className="p-3 rounded-xl bg-bg-elevated border border-border shadow-dropdown text-xs space-y-1">
                      <div className="font-semibold text-content-primary mb-1 border-b border-border pb-1">
                        {item.rule}
                      </div>
                      <div className="flex items-center justify-between gap-4 text-accent">
                        <span>Reports:</span>
                        <span className="font-bold">{item.count}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-content-muted">
                        <span>Share:</span>
                        <span>{percentage}%</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={data}
              dataKey="count"
              nameKey="rule"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              stroke="var(--surface-primary)"
              strokeWidth={2}
              cursor="pointer"
              onClick={(entry) => onSelectRule && onSelectRule(entry.rule as LifeSavingRule)}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-content-primary">{total}</span>
          <span className="text-[10px] uppercase font-semibold text-content-muted">Reports</span>
        </div>
      </div>

      {/* Clean compact legend */}
      <div className="w-full md:w-1/2 space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
        {data.map((item, idx) => (
          <button
            key={item.rule}
            onClick={() => onSelectRule && onSelectRule(item.rule)}
            className="w-full flex items-center justify-between text-left px-2 py-1 rounded-lg hover:bg-bg-secondary transition-colors text-xs text-content-secondary group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="truncate group-hover:text-content-primary transition-colors">
                {item.rule}
              </span>
            </div>
            <span className="font-mono text-[11px] text-content-muted group-hover:text-accent shrink-0 ml-2">
              {item.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
