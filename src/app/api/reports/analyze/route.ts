import { NextRequest, NextResponse } from 'next/server';
import { analyzeReport } from '@/lib/nlp/engine';
import { reportsStore } from '@/lib/store/reports_store';
import { Report, ReportType } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { report_text, report_type, site, date, activity, auto_save = false } = body;

    if (!report_text || typeof report_text !== 'string' || report_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'report_text is required and must not be empty' },
        { status: 400 }
      );
    }

    const thresholds = reportsStore.getThresholds();
    const analysis = analyzeReport(
      {
        report_text,
        report_type: (report_type as ReportType) || 'Near Miss',
        site: site || 'Moran Tank Farm',
        date: date || new Date().toISOString().split('T')[0],
        activity,
      },
      thresholds
    );

    // Save to store if requested so the user immediately sees it across the platform
    if (auto_save) {
      const fullReport: Report = {
        id: analysis.report_id,
        report_text,
        report_type: (report_type as ReportType) || 'Near Miss',
        site: site || 'Not identified in the report',
        date: date || new Date().toISOString().split('T')[0],
        activity: analysis.activity,
        location: analysis.location,
        hazard: analysis.hazard,
        barrier_failure: analysis.barrier_failure,
        sif_potential: analysis.sif_potential,
        sif_score: analysis.sif_score,
        life_saving_rule: analysis.life_saving_rule,
        sif_precursor: analysis.sif_precursor,
        explanation: analysis.explanation,
        evidence: analysis.evidence,
        recommended_actions: analysis.recommended_actions,
        review_status: 'Pending Review',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      reportsStore.addReport(fullReport);
    }

    // Exact structured JSON response
    return NextResponse.json(analysis, { status: 200 });
  } catch (error: any) {
    const errorMsg = error?.message || '';
    if (errorMsg.includes('does not appear to describe an HSE or safety observation') || errorMsg.includes('too short')) {
      return NextResponse.json(
        {
          error: 'Invalid Safety Report',
          message: errorMsg,
        },
        { status: 422 }
      );
    }

    console.error('API Error in analyzeReport:', error);
    return NextResponse.json(
      { error: 'Internal server error while analyzing report' },
      { status: 500 }
    );
  }
}
