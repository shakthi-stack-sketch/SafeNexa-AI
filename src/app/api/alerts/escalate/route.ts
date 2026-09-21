import { NextRequest, NextResponse } from 'next/server';
import { reportsStore } from '@/lib/store/reports_store';
import { triggerN8nWorkflow } from '@/lib/automation/n8n_client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, escalated_to = 'Executive Management & Asset HSE Manager' } = body;

    if (!id) {
      return NextResponse.json({ error: 'Alert id is required' }, { status: 400 });
    }

    const updated = reportsStore.updateAlertStatus(id, 'ESCALATED', {
      escalated_to,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Trigger existing n8n workflow: 'Escalated Safety Report'
    const automationResult = await triggerN8nWorkflow({
      workflow: 'Escalated Safety Report',
      alert_id: updated.id,
      report_id: updated.report_id,
      severity: updated.severity,
      title: `ESCALATION: ${updated.trigger}`,
      source: updated.source || 'manual',
      location: updated.site,
      narrative: `HSE Escalation triggered for alert ${updated.id}. Precursor: ${updated.precursor}. Required Action: ${updated.required_action || 'Executive review and operational intervention.'}`,
      metadata: {
        escalated_to,
        activity: updated.activity,
      },
      timestamp: updated.escalated_at || new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      alert: updated,
      automation: automationResult,
      message: `Alert ${id} escalated to ${escalated_to}.`,
      escalated_at: updated.escalated_at,
    });
  } catch (error) {
    console.error('Error in POST /api/alerts/escalate:', error);
    return NextResponse.json({ error: 'Failed to escalate alert' }, { status: 500 });
  }
}
