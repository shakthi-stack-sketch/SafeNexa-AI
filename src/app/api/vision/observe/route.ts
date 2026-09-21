import { NextRequest, NextResponse } from 'next/server';
import { analyzeReport } from '@/lib/nlp/engine';
import { reportsStore } from '@/lib/store/reports_store';
import { triggerN8nWorkflow } from '@/lib/automation/n8n_client';
import { Report } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      violation_type = 'NO_HELMET',
      zone = 'Moran Tank Farm - Gantry Zone 1',
      confidence = 0.94,
      notes = '',
    } = body;

    // 1. Construct concise, grounded observation narrative for the existing SIF NLP engine
    let observationNarrative = '';
    let activity = 'Working at Elevation';

    if (violation_type === 'NO_HELMET') {
      observationNarrative = `Automated Computer Vision Safety Observation: Worker detected without required safety helmet and hard hat in active industrial operations zone. Unsafe act observed at ${zone}. Critical safety barrier failure: Required safety helmet was absent. Potential line of fire and falling object exposure.`;
      activity = 'Working at Elevation';
    } else if (violation_type === 'NO_VEST') {
      observationNarrative = `Automated Computer Vision Safety Observation: Worker detected without required high-visibility safety vest in active operational area. Unsafe condition observed at ${zone}. Barrier failure: Required high-visibility PPE missing in hazardous vehicle path.`;
      activity = 'Field Transport & Driving';
    } else {
      observationNarrative = `Automated Computer Vision Safety Observation: Routine PPE verification check conducted. Personnel detected with full compliant hard hat, helmet, and safety vest at ${zone}.`;
      activity = 'Working at Elevation';
    }

    if (notes) {
      observationNarrative += ` Field Notes: ${notes}`;
    }

    // 2. Pass through the EXISTING SafeNexa SIF classification engine
    const thresholds = reportsStore.getThresholds();
    const analysis = analyzeReport(
      {
        report_text: observationNarrative,
        report_type: 'Unsafe Act',
        site: zone,
        date: new Date().toISOString().split('T')[0],
        activity,
      },
      thresholds
    );

    // 3. Save as a first-class structured report in the SafeNexa store
    const fullReport: Report = {
      id: analysis.report_id,
      report_text: observationNarrative,
      report_type: 'Unsafe Act',
      site: zone,
      date: new Date().toISOString().split('T')[0],
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
      source: 'computer_vision',
      observation_type: violation_type,
      is_demo: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    reportsStore.addReport(fullReport);

    // 4. Trigger n8n "Critical Safety Alert" workflow for High SIF / No Helmet
    let workflowResult = null;
    if (analysis.sif_potential === 'HIGH' || violation_type === 'NO_HELMET') {
      workflowResult = await triggerN8nWorkflow({
        workflow: 'Critical Safety Alert',
        report_id: fullReport.id,
        severity: 'CRITICAL',
        title: `CRITICAL PPE VIOLATION: Hardhat Absent at ${zone}`,
        source: 'computer_vision',
        location: zone,
        narrative: observationNarrative,
        metadata: {
          confidence,
          violation_type,
          rule: analysis.life_saving_rule,
        },
        timestamp: fullReport.created_at,
      });
    }

    // 5. Inspect if repeated violations at this zone form a recurrence pattern
    const recentVisionReportsAtZone = reportsStore
      .getReports()
      .filter((r) => r.source === 'computer_vision' && r.site === zone);

    let recurrenceTriggered = false;
    if (recentVisionReportsAtZone.length >= 3) {
      recurrenceTriggered = true;
      // Trigger n8n "Recurrence Patterns" workflow
      await triggerN8nWorkflow({
        workflow: 'Recurrence Patterns',
        report_id: fullReport.id,
        severity: 'HIGH',
        title: `Recurring PPE Non-Compliance Cluster at ${zone} (${recentVisionReportsAtZone.length} occurrences)`,
        source: 'computer_vision',
        location: zone,
        narrative: `${recentVisionReportsAtZone.length} repeated automated PPE violations detected at ${zone}. Trend is escalating.`,
        metadata: {
          cluster_count: recentVisionReportsAtZone.length,
          zone,
        },
        timestamp: fullReport.created_at,
      });
    }

    // 6. Find the generated alert from the store
    const generatedAlert = reportsStore.getAlerts().find((a) => a.report_id === fullReport.id);

    return NextResponse.json(
      {
        success: true,
        report_id: fullReport.id,
        source: 'computer_vision',
        observation: {
          id: fullReport.id,
          observation_text: observationNarrative,
          violation_type,
          zone,
          confidence,
          sif_potential: analysis.sif_potential,
          sif_score: analysis.sif_score,
          life_saving_rule: analysis.life_saving_rule,
          barrier_failure: analysis.barrier_failure,
          created_at: fullReport.created_at,
          status: 'Pending HSE Review',
        },
        alert: generatedAlert || null,
        recurrence: {
          is_recurring: recurrenceTriggered,
          zone_violation_count: recentVisionReportsAtZone.length,
        },
        automation: workflowResult,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/vision/observe:', error);
    return NextResponse.json(
      {
        error: 'Failed to record automated safety observation',
        message: error?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
