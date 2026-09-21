import { NextRequest, NextResponse } from 'next/server';
import { reportsStore } from '@/lib/store/reports_store';
import { analyzeReport } from '@/lib/nlp/engine';
import { Report, ReportType } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.toLowerCase() || '';
    const sif = searchParams.get('sif') || '';
    const rule = searchParams.get('rule') || '';
    const site = searchParams.get('site') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let list = reportsStore.getReports();

    if (q) {
      list = list.filter(
        r =>
          r.id.toLowerCase().includes(q) ||
          r.report_text.toLowerCase().includes(q) ||
          r.activity.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.hazard.toLowerCase().includes(q) ||
          r.sif_precursor.toLowerCase().includes(q)
      );
    }

    if (sif) {
      list = list.filter(r => r.sif_potential.toLowerCase() === sif.toLowerCase());
    }

    if (rule) {
      list = list.filter(r => r.life_saving_rule.toLowerCase() === rule.toLowerCase());
    }

    if (site) {
      list = list.filter(r => r.site.toLowerCase() === site.toLowerCase());
    }

    if (type) {
      list = list.filter(r => r.report_type.toLowerCase() === type.toLowerCase());
    }

    if (status) {
      list = list.filter(r => r.review_status.toLowerCase() === status.toLowerCase());
    }

    const total = list.length;
    const paginated = list.slice(offset, offset + limit);

    return NextResponse.json({
      total,
      offset,
      limit,
      reports: paginated,
    });
  } catch (error) {
    console.error('Error in GET /api/reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const narrativeText = (body.report_text || body.narrative || body.description || '').trim();

    if (!narrativeText) {
      return NextResponse.json({ error: 'report_text required' }, { status: 400 });
    }

    // Automatically call the EXISTING SafeNexa report-analysis function
    const thresholds = reportsStore.getThresholds();
    const reportType = (body.report_type as ReportType) || 'Near Miss';
    const site = body.site || body.location || 'Moran Central Tank Farm';
    const date = body.date || new Date().toISOString().split('T')[0];
    const activity = body.activity || undefined;

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

    // Build the complete analysed report record
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
      is_demo: false,
      source: body.source || 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save the analysis result so it is immediately visible in HSE Officer Reports view
    reportsStore.addReport(savedReport);

    // Automatically trigger Workflow 1 (Critical Safety Alert) for HIGH SIF reports
    let workflowTriggered = false;
    let workflowStatus: number | null = null;

    if (savedReport.sif_potential === 'HIGH') {
      const webhookUrl = process.env.N8N_CRITICAL_ALERT_WEBHOOK || 'http://localhost:5678/webhook/safenexa-critical-alert';
      try {
        console.log('Sending Critical Safety Alert to n8n...');
        console.log('Webhook URL:', webhookUrl);
        console.log('Trigger condition:', savedReport.sif_potential);

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            report_id: savedReport.id,
            report_text: savedReport.report_text,
            report_type: savedReport.report_type,
            site: savedReport.site,
            activity: savedReport.activity,
            location: savedReport.location,
            hazard: savedReport.hazard,
            barrier_failure: savedReport.barrier_failure,
            sif_potential: savedReport.sif_potential,
            sif_score: savedReport.sif_score,
            life_saving_rule: savedReport.life_saving_rule,
            sif_precursor: savedReport.sif_precursor,
            explanation: savedReport.explanation,
            evidence: savedReport.evidence,
            recommended_actions: savedReport.recommended_actions,
            review_status: savedReport.review_status,
            date: savedReport.date,
            created_at: savedReport.created_at,
          }),
        });

        workflowStatus = webhookResponse.status;
        console.log('HTTP response:', webhookResponse.status);
        const responseBody = await webhookResponse.text();
        console.log('Response body:', responseBody);

        if (webhookResponse.ok) {
          workflowTriggered = true;
        }
      } catch (webhookError) {
        console.error('Critical Safety Alert webhook failed:', webhookError);
      }
    }

    return NextResponse.json(
      {
        ...savedReport,
        analysis,
        workflow_1_triggered: workflowTriggered,
        workflow_1_status: workflowStatus,
      },
      { status: 201 }
    );
  } catch (error: any) {
    const errorMsg = error?.message || '';
    if (errorMsg.includes('does not appear to describe an HSE or safety observation') || errorMsg.includes('too short')) {
      return NextResponse.json({ error: errorMsg }, { status: 422 });
    }
    console.error('Error in POST /api/reports:', error);
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}
