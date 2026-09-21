import { NextRequest, NextResponse } from 'next/server';
import { reportsStore } from '@/lib/store/reports_store';

export const dynamic = 'force-dynamic';

const N8N_API_KEY =
  process.env.N8N_API_KEY ||
  'SafeNexa_N8N_Automation_2026_Secure_Key_X9K7P2';

export async function GET(req: NextRequest) {
  try {
    // Verify n8n API key
    const apiKey = req.headers.get('x-api-key');

    if (apiKey !== N8N_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Get all reports from SafeNexa
    const reports = reportsStore.getReports();

    // Return only the information needed for pattern detection
    const reportData = reports.map((report) => ({
      id: report.id,
      site: report.site,
      activity: report.activity,
      location: report.location,
      hazard: report.hazard,
      barrier_failure: report.barrier_failure,
      sif_potential: report.sif_potential,
      sif_score: report.sif_score,
      life_saving_rule: report.life_saving_rule,
      sif_precursor: report.sif_precursor,
      review_status: report.review_status,
      date: report.date,
    }));

    return NextResponse.json({
      success: true,
      total_reports: reportData.length,
      reports: reportData,
    });
  } catch (error) {
    console.error('Error in GET /api/n8n/patterns:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pattern data',
      },
      { status: 500 }
    );
  }
}