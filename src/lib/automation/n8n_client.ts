/**
 * SAFENEXA — n8n Automation Pipeline Integration Client
 *
 * Preserves and connects to the existing 4 n8n workflows:
 * 1. Critical Safety Alert
 * 2. Escalated Safety Report
 * 3. Daily Safety Intelligence
 * 4. Recurrence Patterns
 *
 * Implements graceful offline resiliency when n8n is unavailable.
 */

export type N8nWorkflowType =
  | 'Critical Safety Alert'
  | 'Escalated Safety Report'
  | 'Daily Safety Intelligence'
  | 'Recurrence Patterns';

export interface WorkflowDispatchPayload {
  workflow: N8nWorkflowType;
  alert_id?: string;
  report_id?: string;
  severity?: string;
  title: string;
  source: 'manual' | 'computer_vision' | 'sensor';
  location: string;
  narrative: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface WorkflowDispatchResult {
  success: boolean;
  workflow: N8nWorkflowType;
  status: 'DISPATCHED_WEBHOOK' | 'RETAINED_FOR_REVIEW' | 'SIMULATED_SUCCESS';
  message: string;
  dispatched_at: string;
  payload: WorkflowDispatchPayload;
}

// In-memory audit trail of automation events for HSE observability
const automationAuditLog: WorkflowDispatchResult[] = [];

/**
 * Dispatches an event to the requested n8n workflow.
 * Falls back cleanly with clear user-facing explanation if the external service is unreachable.
 */
export async function triggerN8nWorkflow(payload: WorkflowDispatchPayload): Promise<WorkflowDispatchResult> {
  const timestamp = new Date().toISOString();
  const webhookEnvVarMap: Record<N8nWorkflowType, string | undefined> = {
    'Critical Safety Alert': process.env.N8N_CRITICAL_ALERT_WEBHOOK || 'http://localhost:5678/webhook/safenexa-critical-alert',
    'Escalated Safety Report': process.env.N8N_ESCALATION_WEBHOOK || 'http://localhost:5678/webhook/safenexa-escalated-report',
    'Daily Safety Intelligence': process.env.N8N_DAILY_INTEL_WEBHOOK,
    'Recurrence Patterns': process.env.N8N_RECURRENCE_WEBHOOK,
  };

  const webhookUrl = webhookEnvVarMap[payload.workflow] || process.env.N8N_DEFAULT_WEBHOOK;

  if (webhookUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          pipeline: 'SafeNexa Safety Automation',
          sent_at: timestamp,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const result: WorkflowDispatchResult = {
          success: true,
          workflow: payload.workflow,
          status: 'DISPATCHED_WEBHOOK',
          message: `Successfully executed '${payload.workflow}' via n8n automation engine.`,
          dispatched_at: timestamp,
          payload,
        };
        automationAuditLog.unshift(result);
        return result;
      }
    } catch (err) {
      console.warn(`[SafeNexa n8n] Webhook connection failed for ${payload.workflow}:`, err);
    }
  }

  // Graceful fallback: Retain event in safety registry without application failure
  const fallbackResult: WorkflowDispatchResult = {
    success: true,
    workflow: payload.workflow,
    status: 'RETAINED_FOR_REVIEW',
    message: 'Automation service unavailable. The observation has been retained for review.',
    dispatched_at: timestamp,
    payload,
  };

  automationAuditLog.unshift(fallbackResult);
  if (automationAuditLog.length > 50) {
    automationAuditLog.pop();
  }

  return fallbackResult;
}

export function getAutomationAuditLog(): WorkflowDispatchResult[] {
  return [...automationAuditLog];
}
