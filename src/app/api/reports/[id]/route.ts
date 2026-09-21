import { NextRequest, NextResponse } from 'next/server';
import { reportsStore } from '@/lib/store/reports_store';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const report = reportsStore.getReportById(params.id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    return NextResponse.json(report);
  } catch (error) {
    console.error(`Error in GET /api/reports/${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, comment, corrected_sif_potential } = body;

    const updated = reportsStore.updateReportStatus(
      params.id,
      status,
      comment,
      corrected_sif_potential
    );

    if (!updated) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // If the report is escalated, notify n8n automatically
    if (updated.review_status === 'Escalated') {
      try {
        const webhookUrl = process.env.N8N_ESCALATION_WEBHOOK || 'http://localhost:5678/webhook/safenexa-escalated-report';
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            report_id: updated.id,
            site: updated.site,
            activity: updated.activity,
            location: updated.location,
            hazard: updated.hazard,
            barrier_failure: updated.barrier_failure,
            sif_potential: updated.sif_potential,
            sif_score: updated.sif_score,
            life_saving_rule: updated.life_saving_rule,
            sif_precursor: updated.sif_precursor,
            review_status: updated.review_status,
            comment: comment || updated.reviewer_comment || '',
          }),
        });

        console.log(`Escalated report ${updated.id} successfully sent to n8n`);
      } catch (n8nError) {
        console.error('Failed to send escalated report to n8n:', n8nError);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`Error in PATCH /api/reports/${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
