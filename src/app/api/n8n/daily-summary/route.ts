import { NextRequest, NextResponse } from 'next/server';
import { reportsStore } from '@/lib/store/reports_store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Verify the request is coming from an authorized automation
    const apiKey = req.headers.get('x-api-key');

    if (!process.env.N8N_API_KEY) {
      console.error('N8N_API_KEY is not configured.');

      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!apiKey || apiKey !== process.env.N8N_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Get all reports from SafeNexa
    const reports = reportsStore.getReports();

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Get reports created today
    const todayReports = reports.filter((report) => {
      return report.created_at.startsWith(today);
    });

    // Calculate SIF statistics
    const highSifReports = todayReports.filter(
      (report) => report.sif_potential === 'HIGH'
    );

    const mediumSifReports = todayReports.filter(
      (report) => report.sif_potential === 'MEDIUM'
    );

    const lowSifReports = todayReports.filter(
      (report) => report.sif_potential === 'LOW'
    );

    const nonSifReports = todayReports.filter(
      (report) => report.sif_potential === 'NON-SIF'
    );

    // Escalated reports
    const escalatedReports = todayReports.filter(
      (report) => report.review_status === 'Escalated'
    );

    // High SIF reports for management attention
    const criticalReports = highSifReports.map((report) => ({
      id: report.id,
      site: report.site,
      activity: report.activity,
      location: report.location,
      hazard: report.hazard,
      sif_score: report.sif_score,
      life_saving_rule: report.life_saving_rule,
      sif_precursor: report.sif_precursor,
      review_status: report.review_status,
    }));

    return NextResponse.json({
      success: true,
      date: today,

      summary: {
        total_reports: todayReports.length,
        high_sif: highSifReports.length,
        medium_sif: mediumSifReports.length,
        low_sif: lowSifReports.length,
        non_sif: nonSifReports.length,
        escalated_reports: escalatedReports.length,
      },

      critical_reports: criticalReports,

      reports: todayReports,
    });
  } catch (error) {
    console.error('Error generating daily safety summary:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate daily safety summary',
      },
      { status: 500 }
    );
  }
}