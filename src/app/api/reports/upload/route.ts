import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromBuffer } from '@/lib/extractor/text_extractor';
import { analyzeReport } from '@/lib/nlp/engine';
import { reportsStore } from '@/lib/store/reports_store';
import { Report, ReportType } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const pastedText = formData.get('report_text') as string | null;
    const reportType = (formData.get('report_type') as ReportType) || 'Near Miss';
    const site = (formData.get('site') as string) || 'Moran Central Tank Farm';
    const date = (formData.get('date') as string) || new Date().toISOString().split('T')[0];
    const activity = (formData.get('activity') as string) || undefined;

    let narrativeText = '';

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const extraction = await extractTextFromBuffer(buffer, file.name);

      if (extraction.error) {
        return NextResponse.json(
          { error: extraction.error },
          { status: 422 }
        );
      }
      narrativeText = extraction.text;
    } else if (pastedText && pastedText.trim().length > 0) {
      narrativeText = pastedText.trim();
    } else {
      return NextResponse.json(
        { error: 'Please provide either a valid report file (PDF, DOCX, TXT) or paste report narrative text.' },
        { status: 400 }
      );
    }

    if (narrativeText.length < 10) {
      return NextResponse.json(
        { error: 'The report text is too brief for safety precursor evaluation. Please provide a descriptive observation narrative.' },
        { status: 400 }
      );
    }

    // Execute NLP & SIF Precursor Detection Engine
    const thresholds = reportsStore.getThresholds();
    const analysis = analyzeReport(
      {
        report_text: narrativeText,
        report_type: reportType,
        site,
        date,
        activity,
      },
      thresholds
    );

    // Build complete report record
    const savedReport: Report = {
      id: analysis.report_id,
      report_text: narrativeText,
      report_type: reportType,
      site,
      date,
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
      is_demo: false, // Explicitly tagged as real uploaded data
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Persist to database
    reportsStore.addReport(savedReport);

    return NextResponse.json(
      {
        report_id: savedReport.id,
        status: 'completed',
        report: savedReport,
        analysis,
      },
      { status: 201 }
    );
  } catch (error: any) {
    const errorMsg = error?.message || '';
    if (errorMsg.includes('does not appear to describe an HSE or safety observation') || errorMsg.includes('too short')) {
      return NextResponse.json(
        { error: errorMsg },
        { status: 422 }
      );
    }

    console.error('Error in /api/reports/upload:', error);
    return NextResponse.json(
      { error: 'Upload processing failed. Please check the file and try again.' },
      { status: 500 }
    );
  }
}
