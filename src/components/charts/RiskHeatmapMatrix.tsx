'use client';

import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

interface HeatmapCell {
  activity: string;
  location: string;
  totalReports: number;
  sifReports: number;
  density: number; // 0 to 1
}

interface RiskHeatmapMatrixProps {
  activities?: string[];
  locations?: string[];
  matrix?: Record<string, Record<string, { total: number; sif: number }>>;
  hasLocationData?: boolean;
  onCellClick?: (activity: string, location: string) => void;
}

export function RiskHeatmapMatrix({
  activities = [],
  locations = [],
  matrix = {},
  hasLocationData = false,
  onCellClick,
}: RiskHeatmapMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  const getCellIntensity = (total: number, sif: number) => {
    if (total === 0) return 'bg-bg-secondary/40 text-content-muted border-transparent';
    const density = sif / total;
    if (density >= 0.75) {
      return 'bg-sif-high/30 border-sif-high/40 text-sif-high hover:bg-sif-high/40';
    }
    if (density >= 0.5) {
      return 'bg-sif-medium/25 border-sif-medium/40 text-sif-medium hover:bg-sif-medium/35';
    }
    return 'bg-accent/15 border-accent/25 text-accent hover:bg-accent/25';
  };

  if (!hasLocationData || activities.length === 0 || locations.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-bg-secondary border border-border text-center space-y-2">
        <MapPin className="w-6 h-6 text-accent mx-auto mb-1 opacity-70" />
        <h4 className="text-xs font-bold text-content-primary">
          Location Data Not Available
        </h4>
        <p className="text-xs text-content-muted max-w-md mx-auto">
          A heatmap will be generated when analyzed safety reports contain usable location information.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="overflow-x-auto pb-2">
        <table className="w-full min-w-[580px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2.5 text-left font-semibold uppercase tracking-wider text-content-muted border-b border-border w-48">
                Activity \ Location
              </th>
              {locations.map((loc) => (
                <th
                  key={loc}
                  className="p-2.5 text-center font-semibold text-content-secondary border-b border-border truncate"
                >
                  {loc}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activities.map((act) => (
              <tr key={act} className="border-b border-border/60">
                <td className="p-2.5 font-medium text-content-primary truncate">
                  {act}
                </td>
                {locations.map((loc) => {
                  const entry = matrix[act]?.[loc] || { total: 0, sif: 0 };
                  const density = entry.total > 0 ? entry.sif / entry.total : 0;
                  const intensityClass = getCellIntensity(entry.total, entry.sif);

                  return (
                    <td key={loc} className="p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => onCellClick && onCellClick(act, loc)}
                        onMouseEnter={() =>
                          setHoveredCell({
                            activity: act,
                            location: loc,
                            totalReports: entry.total,
                            sifReports: entry.sif,
                            density,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-full py-2 px-1 rounded-lg border transition-all text-xs font-mono font-bold flex flex-col items-center justify-center cursor-pointer ${intensityClass}`}
                        disabled={entry.total === 0}
                      >
                        {entry.total > 0 ? (
                          <>
                            <span>{Math.round(density * 100)}%</span>
                            <span className="text-[10px] opacity-75 font-normal">
                              ({entry.sif}/{entry.total})
                            </span>
                          </>
                        ) : (
                          <span className="text-content-muted opacity-40">—</span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dynamic Hover Detail Tooltip Banner */}
      <div className="p-3 rounded-xl bg-bg-secondary border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        {hoveredCell && hoveredCell.totalReports > 0 ? (
          <>
            <div className="space-x-2">
              <span className="font-semibold text-content-primary">
                {hoveredCell.activity}
              </span>
              <span className="text-content-muted">at</span>
              <span className="font-medium text-accent">
                {hoveredCell.location}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-content-muted">
                Total: <strong className="text-content-primary">{hoveredCell.totalReports}</strong>
              </span>
              <span className="text-sif-high">
                SIF Potential: <strong>{hoveredCell.sifReports}</strong>
              </span>
              <span className="text-accent font-bold">
                Precursor Density: {Math.round(hoveredCell.density * 100)}%
              </span>
            </div>
          </>
        ) : (
          <div className="text-content-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>Hover or click on any matrix cell to inspect SIF precursor density metrics.</span>
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] text-content-muted">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-sif-high/40 border border-sif-high" />
            High Density (≥75%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-sif-medium/40 border border-sif-medium" />
            Medium (50–74%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-accent/25 border border-accent" />
            Low (&lt;50%)
          </span>
        </div>
      </div>
    </div>
  );
}
