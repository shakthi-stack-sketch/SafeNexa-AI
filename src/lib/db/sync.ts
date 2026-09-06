import fs from 'fs';
import path from 'path';
import { getPrismaClient, isPostgresConfigured } from './prisma';
import { Report, PrecursorPattern, HSEAlert, HSEFeedback, User, ModelThresholds } from '../types';

export interface SyncResult {
  success: boolean;
  message: string;
  synced: {
    users: number;
    reports: number;
    patterns: number;
    alerts: number;
    feedback: number;
  };
  errors: string[];
}

/**
 * Migrates data from local JSON files (data/database.json & data/users.json)
 * into the configured PostgreSQL database via Prisma.
 */
export async function syncJsonToPostgres(): Promise<SyncResult> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return {
      success: false,
      message: 'PostgreSQL is not configured. Please define DATABASE_URL in .env before syncing.',
      synced: { users: 0, reports: 0, patterns: 0, alerts: 0, feedback: 0 },
      errors: ['DATABASE_URL is not set or invalid.'],
    };
  }

  const errors: string[] = [];
  const synced = {
    users: 0,
    reports: 0,
    patterns: 0,
    alerts: 0,
    feedback: 0,
  };

  const dataDir = path.join(process.cwd(), 'data');
  const dbFile = path.join(dataDir, 'database.json');
  const usersFile = path.join(dataDir, 'users.json');

  // 1. Sync Users
  if (fs.existsSync(usersFile)) {
    try {
      const users: User[] = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
      for (const u of users) {
        await prisma.user.upsert({
          where: { email: u.email },
          update: {
            name: u.name,
            organization: u.organization,
            role: u.role,
            password_hash: u.password_hash,
            salt: u.salt,
            last_login: u.last_login ? new Date(u.last_login) : null,
          },
          create: {
            id: u.id,
            name: u.name,
            email: u.email,
            organization: u.organization,
            role: u.role,
            password_hash: u.password_hash,
            salt: u.salt,
            created_at: u.created_at ? new Date(u.created_at) : new Date(),
            last_login: u.last_login ? new Date(u.last_login) : null,
          },
        });
        synced.users++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to sync users: ${msg}`);
    }
  }

  // 2. Sync Reports, Patterns, Alerts, Feedback
  if (fs.existsSync(dbFile)) {
    try {
      const dbData = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));

      // Reports
      if (Array.isArray(dbData.reports)) {
        for (const r of dbData.reports as Report[]) {
          await prisma.report.upsert({
            where: { id: r.id },
            update: {
              report_text: r.report_text,
              report_type: r.report_type,
              site: r.site,
              date: r.date,
              activity: r.activity,
              location: r.location,
              hazard: r.hazard,
              barrier_failure: r.barrier_failure,
              sif_potential: r.sif_potential,
              sif_score: r.sif_score,
              life_saving_rule: r.life_saving_rule,
              sif_precursor: r.sif_precursor,
              explanation: r.explanation,
              evidence: r.evidence || [],
              recommended_actions: (r.recommended_actions || { immediate: [], control: [], verification: [], preventive: [] }) as unknown as object,
              review_status: r.review_status || 'Pending Review',
              reviewer_comment: r.reviewer_comment || null,
              corrected_sif_potential: r.corrected_sif_potential || null,
              is_demo: !!r.is_demo,
            },
            create: {
              id: r.id,
              report_text: r.report_text,
              report_type: r.report_type,
              site: r.site,
              date: r.date,
              activity: r.activity,
              location: r.location,
              hazard: r.hazard,
              barrier_failure: r.barrier_failure,
              sif_potential: r.sif_potential,
              sif_score: r.sif_score,
              life_saving_rule: r.life_saving_rule,
              sif_precursor: r.sif_precursor,
              explanation: r.explanation,
              evidence: r.evidence || [],
              recommended_actions: (r.recommended_actions || { immediate: [], control: [], verification: [], preventive: [] }) as unknown as object,
              review_status: r.review_status || 'Pending Review',
              reviewer_comment: r.reviewer_comment || null,
              corrected_sif_potential: r.corrected_sif_potential || null,
              is_demo: !!r.is_demo,
              created_at: r.created_at ? new Date(r.created_at) : new Date(),
              updated_at: r.updated_at ? new Date(r.updated_at) : new Date(),
            },
          });
          synced.reports++;
        }
      }

      // Precursor Patterns
      if (Array.isArray(dbData.patterns)) {
        for (const p of dbData.patterns as PrecursorPattern[]) {
          await prisma.precursorPattern.upsert({
            where: { id: p.id },
            update: {
              pattern_name: p.pattern_name,
              activity: p.activity,
              location: p.location,
              barrier_failure: p.barrier_failure,
              frequency: p.frequency,
              sif_count: p.sif_count,
              sif_density: p.sif_density,
              trend: p.trend,
              associated_hazard: p.associated_hazard,
              life_saving_rule: p.life_saving_rule,
              representative_report_ids: p.representative_report_ids || [],
              recommended_intervention: p.recommended_intervention,
              is_demo: !!p.is_demo,
            },
            create: {
              id: p.id,
              pattern_name: p.pattern_name,
              activity: p.activity,
              location: p.location,
              barrier_failure: p.barrier_failure,
              frequency: p.frequency,
              sif_count: p.sif_count,
              sif_density: p.sif_density,
              trend: p.trend,
              associated_hazard: p.associated_hazard,
              life_saving_rule: p.life_saving_rule,
              representative_report_ids: p.representative_report_ids || [],
              recommended_intervention: p.recommended_intervention,
              is_demo: !!p.is_demo,
              created_at: p.created_at ? new Date(p.created_at) : new Date(),
            },
          });
          synced.patterns++;
        }
      }

      // HSE Alerts
      if (Array.isArray(dbData.alerts)) {
        for (const a of dbData.alerts as HSEAlert[]) {
          await prisma.hSEAlert.upsert({
            where: { id: a.id },
            update: {
              severity: a.severity,
              trigger: a.trigger,
              report_id: a.report_id || null,
              site: a.site,
              activity: a.activity,
              precursor: a.precursor,
              status: a.status,
              is_demo: !!a.is_demo,
              assigned_to: a.assigned_to || null,
              resolved_at: a.resolved_at ? new Date(a.resolved_at) : null,
            },
            create: {
              id: a.id,
              severity: a.severity,
              trigger: a.trigger,
              report_id: a.report_id || null,
              site: a.site,
              activity: a.activity,
              precursor: a.precursor,
              status: a.status,
              is_demo: !!a.is_demo,
              assigned_to: a.assigned_to || null,
              created_at: a.created_at ? new Date(a.created_at) : new Date(),
              resolved_at: a.resolved_at ? new Date(a.resolved_at) : null,
            },
          });
          synced.alerts++;
        }
      }

      // HSE Feedback
      if (Array.isArray(dbData.feedback)) {
        for (const fb of dbData.feedback as HSEFeedback[]) {
          await prisma.hSEFeedback.upsert({
            where: { id: fb.id },
            update: {
              report_id: fb.report_id,
              ai_prediction: fb.ai_prediction as unknown as object,
              hse_correction: fb.hse_correction as unknown as object,
              reviewer_comment: fb.reviewer_comment,
              reviewer_name: fb.reviewer_name,
            },
            create: {
              id: fb.id,
              report_id: fb.report_id,
              ai_prediction: fb.ai_prediction as unknown as object,
              hse_correction: fb.hse_correction as unknown as object,
              reviewer_comment: fb.reviewer_comment,
              reviewer_name: fb.reviewer_name,
              created_at: fb.created_at ? new Date(fb.created_at) : new Date(),
            },
          });
          synced.feedback++;
        }
      }

      // System settings: Thresholds and Demo Mode
      if (dbData.thresholds) {
        await prisma.systemSetting.upsert({
          where: { key: 'thresholds' },
          update: { value: dbData.thresholds },
          create: { key: 'thresholds', value: dbData.thresholds },
        });
      }
      if (dbData.is_demo_mode !== undefined) {
        await prisma.systemSetting.upsert({
          where: { key: 'is_demo_mode' },
          update: { value: { enabled: !!dbData.is_demo_mode } },
          create: { key: 'is_demo_mode', value: { enabled: !!dbData.is_demo_mode } },
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to sync database.json: ${msg}`);
    }
  }

  const success = errors.length === 0;
  return {
    success,
    message: success
      ? `Successfully synchronized data to PostgreSQL (${synced.reports} reports, ${synced.users} users, ${synced.patterns} patterns, ${synced.alerts} alerts).`
      : `Synchronized with ${errors.length} warnings.`,
    synced,
    errors,
  };
}
