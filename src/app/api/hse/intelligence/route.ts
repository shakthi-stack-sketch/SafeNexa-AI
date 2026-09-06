import { NextResponse } from 'next/server';
import { reportsStore } from '@/lib/store/reports_store';
import { ALL_LIFE_SAVING_RULES } from '@/lib/rules/iogp_rules';

export async function GET() {
  try {
    const reports = reportsStore.getReports();
    const totalReports = reports.length;
    const sifReports = reports.filter(r => r.sif_potential === 'HIGH');
    const medReports = reports.filter(r => r.sif_potential === 'MEDIUM');
    const lowReports = reports.filter(r => r.sif_potential === 'LOW');

    const sifDensity = totalReports > 0 ? Math.round((sifReports.length / totalReports) * 100) : 0;

    // Site ranking
    const siteMap = new Map<string, { total: number; sif: number }>();
    for (const r of reports) {
      if (!siteMap.has(r.site)) siteMap.set(r.site, { total: 0, sif: 0 });
      const item = siteMap.get(r.site)!;
      item.total++;
      if (r.sif_potential === 'HIGH') item.sif++;
    }
    const siteRanking = Array.from(siteMap.entries()).map(([name, stat]) => ({
      name,
      total: stat.total,
      sifCount: stat.sif,
      density: stat.total > 0 ? Math.round((stat.sif / stat.total) * 100) : 0,
    })).sort((a, b) => b.density - a.density);

    // Activity ranking
    const actMap = new Map<string, { total: number; sif: number }>();
    for (const r of reports) {
      if (!actMap.has(r.activity)) actMap.set(r.activity, { total: 0, sif: 0 });
      const item = actMap.get(r.activity)!;
      item.total++;
      if (r.sif_potential === 'HIGH') item.sif++;
    }
    const activityRanking = Array.from(actMap.entries()).map(([name, stat]) => ({
      name,
      total: stat.total,
      sifCount: stat.sif,
      density: stat.total > 0 ? Math.round((stat.sif / stat.total) * 100) : 0,
    })).sort((a, b) => b.density - a.density);

    // Life-Saving Rule distribution
    const ruleDistribution = ALL_LIFE_SAVING_RULES.map(rule => {
      const count = reports.filter(r => r.life_saving_rule === rule).length;
      return { rule, count };
    }).sort((a, b) => b.count - a.count);

    // Temporal trend aggregation (grouped by month string)
    const trendMap = new Map<string, { sifPotential: number; nonSif: number }>();
    for (const r of reports) {
      const d = new Date(r.date);
      const monthKey = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!trendMap.has(monthKey)) trendMap.set(monthKey, { sifPotential: 0, nonSif: 0 });
      const t = trendMap.get(monthKey)!;
      if (r.sif_potential === 'HIGH') {
        t.sifPotential++;
      } else {
        t.nonSif++;
      }
    }
    const trendData = Array.from(trendMap.entries()).map(([date, counts]) => ({
      date,
      sifPotential: counts.sifPotential,
      nonSif: counts.nonSif,
    }));

    // AI Performance metrics: Only display when actual labeled feedback exists, never fabricate accuracy
    const feedbackList = reportsStore.getFeedback();
    const modelEvaluation = feedbackList.length >= 5 ? {
      evaluatedOn: `Human Expert Calibrations (${feedbackList.length} verified observations)`,
      accuracy: null,
      precision: null,
      recall: null,
      f1Score: null,
      classDistribution: {
        high: sifReports.length,
        medium: medReports.length,
        low: lowReports.length,
      },
      note: 'Evaluation metrics will appear after validated labeled data is provided by Oil India Limited.'
    } : null;

    // Dynamic heatmap generation strictly from actual reports
    const validLocationReports = reports.filter(
      (r) => r.location && r.location !== 'Not identified in the report'
    );
    const hasLocationData = validLocationReports.length > 0;

    const heatmapActivities = Array.from(
      new Set(reports.map((r) => r.activity).filter((a) => a && a !== 'Not identified in the report'))
    ).slice(0, 6);

    const heatmapLocations = Array.from(
      new Set(validLocationReports.map((r) => r.location))
    ).slice(0, 6);

    const heatmapMatrix: Record<string, Record<string, { total: number; sif: number }>> = {};
    for (const act of heatmapActivities) {
      heatmapMatrix[act] = {};
      for (const loc of heatmapLocations) {
        heatmapMatrix[act][loc] = { total: 0, sif: 0 };
      }
    }

    for (const r of validLocationReports) {
      if (heatmapMatrix[r.activity] && heatmapMatrix[r.activity][r.location]) {
        heatmapMatrix[r.activity][r.location].total++;
        if (r.sif_potential === 'HIGH' || r.sif_potential === 'MEDIUM') {
          heatmapMatrix[r.activity][r.location].sif++;
        }
      }
    }

    return NextResponse.json({
      summary: {
        totalReports,
        sifReportsCount: sifReports.length,
        mediumReportsCount: medReports.length,
        lowReportsCount: lowReports.length,
        sifDensity,
        activeAlertsCount: reportsStore.getAlerts().filter(a => a.status === 'ACTIVE').length,
      },
      siteRanking,
      activityRanking,
      ruleDistribution: totalReports > 0 ? ruleDistribution : [],
      trendData,
      hasTrendData: trendData.length >= 2,
      heatmap: {
        activities: heatmapActivities,
        locations: heatmapLocations,
        matrix: heatmapMatrix,
        hasLocationData,
      },
      modelEvaluation,
    });
  } catch (error) {
    console.error('Error in GET /api/hse/intelligence:', error);
    return NextResponse.json({ error: 'Failed to aggregate HSE intelligence' }, { status: 500 });
  }
}
