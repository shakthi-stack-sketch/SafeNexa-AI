import { NextRequest, NextResponse } from 'next/server';
import { reportsStore } from '@/lib/store/reports_store';

export async function GET() {
  try {
    const feedback = reportsStore.getFeedback();
    return NextResponse.json({
      total: feedback.length,
      feedback,
    });
  } catch (error) {
    console.error('Error in GET /api/feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback audit trail' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { report_id, ai_prediction, hse_correction, reviewer_comment, reviewer_name, accuracy, comments } = body;

    // Check if direct accuracy feedback was submitted
    if (accuracy && comments !== undefined) {
      const targetReportId = report_id || 'GENERAL';
      const targetReport = targetReportId !== 'GENERAL' ? reportsStore.getReportById(targetReportId) : null;

      const prediction = ai_prediction || {
        sif_potential: targetReport?.sif_potential || 'LOW',
        sif_score: targetReport?.sif_score || 0.25,
        life_saving_rule: targetReport?.life_saving_rule || 'None',
        sif_precursor: targetReport?.sif_precursor || 'General HSE observation',
        barrier_failure: targetReport?.barrier_failure || 'N/A',
      };

      const correction = hse_correction || {
        sif_potential: targetReport?.sif_potential || 'LOW',
        life_saving_rule: targetReport?.life_saving_rule || 'None',
        sif_precursor: targetReport?.sif_precursor || 'General HSE observation',
        barrier_failure: targetReport?.barrier_failure || 'N/A',
      };

      const commentText = `[Accuracy: ${accuracy}] ${comments || reviewer_comment || ''}`.trim();

      const saved = reportsStore.addFeedback({
        report_id: targetReportId,
        ai_prediction: prediction,
        hse_correction: correction,
        reviewer_comment: commentText,
        reviewer_name: reviewer_name || 'HSE Reviewer',
      });

      return NextResponse.json(saved, { status: 201 });
    }

    if (!report_id || !ai_prediction || !hse_correction) {
      return NextResponse.json(
        { error: 'report_id, ai_prediction, and hse_correction (or accuracy and comments) are required' },
        { status: 400 }
      );
    }

    const saved = reportsStore.addFeedback({
      report_id,
      ai_prediction,
      hse_correction,
      reviewer_comment: reviewer_comment || '',
      reviewer_name: reviewer_name || 'HSE User',
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/feedback:', error);
    return NextResponse.json({ error: 'Failed to record HSE feedback' }, { status: 500 });
  }
}
