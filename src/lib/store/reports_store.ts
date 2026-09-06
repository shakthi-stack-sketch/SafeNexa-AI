import fs from 'fs';
import path from 'path';
import { Report, PrecursorPattern, HSEAlert, HSEFeedback, ModelThresholds, SIFPotential, CorrectiveAction } from '../types';
import { INITIAL_DEMO_REPORTS, INITIAL_PRECURSOR_PATTERNS, INITIAL_HSE_ALERTS, INITIAL_HSE_FEEDBACK } from '../data/demo_reports';
import { DEFAULT_THRESHOLDS } from '../nlp/engine';
import { getPrismaClient, isPostgresConfigured, checkPostgresHealth } from '../db/prisma';

interface DatabaseSchema {
  reports: Report[];
  patterns: PrecursorPattern[];
  alerts: HSEAlert[];
  feedback: HSEFeedback[];
  thresholds: ModelThresholds;
  is_demo_mode: boolean;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

class ReportsStore {
  private reports: Report[] = [];
  private patterns: PrecursorPattern[] = [];
  private alerts: HSEAlert[] = [];
  private feedback: HSEFeedback[] = [];
  private thresholds: ModelThresholds = { ...DEFAULT_THRESHOLDS };
  private is_demo_mode: boolean = false;
  private isPostgresActive: boolean = false;
  private isInitializingPostgres: boolean = false;

  constructor() {
    // 1. Instant synchronous load from local JSON cache (0ms latency fallback)
    this.loadFromDisk();
    // 2. Asynchronously verify and hydrate from PostgreSQL if configured
    this.initPostgresIfAvailable().catch((err) => {
      console.warn('[Dual-Mode DB] Non-fatal error initializing PostgreSQL:', err);
    });
  }

  /**
   * Checks if PostgreSQL is configured and reachable via Prisma.
   * If available, synchronizes in-memory cache with PostgreSQL records.
   */
  public async initPostgresIfAvailable(): Promise<boolean> {
    if (!isPostgresConfigured() || this.isInitializingPostgres) {
      return this.isPostgresActive;
    }

    this.isInitializingPostgres = true;
    try {
      const isHealthy = await checkPostgresHealth();
      if (!isHealthy) {
        this.isPostgresActive = false;
        return false;
      }

      const prisma = getPrismaClient();
      if (!prisma) {
        this.isPostgresActive = false;
        return false;
      }

      this.isPostgresActive = true;

      // Load reports from PostgreSQL
      const dbReports = await prisma.report.findMany({
        orderBy: { created_at: 'desc' },
      });

      if (dbReports.length > 0) {
        this.reports = dbReports.map((r) => ({
          id: r.id,
          report_text: r.report_text,
          report_type: r.report_type as Report['report_type'],
          site: r.site,
          date: r.date,
          activity: r.activity,
          location: r.location,
          hazard: r.hazard,
          barrier_failure: r.barrier_failure,
          sif_potential: r.sif_potential as SIFPotential,
          sif_score: r.sif_score,
          life_saving_rule: r.life_saving_rule as Report['life_saving_rule'],
          sif_precursor: r.sif_precursor,
          explanation: r.explanation,
          evidence: Array.isArray(r.evidence) ? (r.evidence as string[]) : [],
          recommended_actions: (r.recommended_actions as unknown as CorrectiveAction) || {
            immediate: [],
            control: [],
            verification: [],
            preventive: [],
          },
          review_status: r.review_status as Report['review_status'],
          reviewer_comment: r.reviewer_comment || undefined,
          corrected_sif_potential: (r.corrected_sif_potential as SIFPotential) || undefined,
          is_demo: r.is_demo,
          created_at: r.created_at.toISOString(),
          updated_at: r.updated_at.toISOString(),
        }));

        // Load patterns
        const dbPatterns = await prisma.precursorPattern.findMany({
          orderBy: { sif_density: 'desc' },
        });
        if (dbPatterns.length > 0) {
          this.patterns = dbPatterns.map((p) => ({
            id: p.id,
            pattern_name: p.pattern_name,
            activity: p.activity,
            location: p.location,
            barrier_failure: p.barrier_failure,
            frequency: p.frequency,
            sif_count: p.sif_count,
            sif_density: p.sif_density,
            trend: p.trend as 'up' | 'down' | 'stable',
            associated_hazard: p.associated_hazard,
            life_saving_rule: p.life_saving_rule as Report['life_saving_rule'],
            representative_report_ids: Array.isArray(p.representative_report_ids)
              ? (p.representative_report_ids as string[])
              : [],
            recommended_intervention: p.recommended_intervention,
            is_demo: p.is_demo,
            created_at: p.created_at.toISOString(),
          }));
        }

        // Load alerts
        const dbAlerts = await prisma.hSEAlert.findMany({
          orderBy: { created_at: 'desc' },
        });
        if (dbAlerts.length > 0) {
          this.alerts = dbAlerts.map((a) => ({
            id: a.id,
            severity: a.severity as HSEAlert['severity'],
            trigger: a.trigger,
            report_id: a.report_id || undefined,
            site: a.site,
            activity: a.activity,
            precursor: a.precursor,
            status: a.status as HSEAlert['status'],
            is_demo: a.is_demo,
            assigned_to: a.assigned_to || undefined,
            created_at: a.created_at.toISOString(),
            resolved_at: a.resolved_at ? a.resolved_at.toISOString() : undefined,
          }));
        }

        // Load feedback
        const dbFeedback = await prisma.hSEFeedback.findMany({
          orderBy: { created_at: 'desc' },
        });
        if (dbFeedback.length > 0) {
          this.feedback = dbFeedback.map((f) => ({
            id: f.id,
            report_id: f.report_id,
            ai_prediction: f.ai_prediction as HSEFeedback['ai_prediction'],
            hse_correction: f.hse_correction as HSEFeedback['hse_correction'],
            reviewer_comment: f.reviewer_comment,
            reviewer_name: f.reviewer_name,
            created_at: f.created_at.toISOString(),
          }));
        }

        // Load system settings
        const thresholdSetting = await prisma.systemSetting.findUnique({
          where: { key: 'thresholds' },
        });
        if (thresholdSetting && typeof thresholdSetting.value === 'object' && thresholdSetting.value !== null) {
          this.thresholds = {
            ...DEFAULT_THRESHOLDS,
            ...(thresholdSetting.value as unknown as ModelThresholds),
          };
        }

        const demoSetting = await prisma.systemSetting.findUnique({
          where: { key: 'is_demo_mode' },
        });
        if (demoSetting && typeof demoSetting.value === 'object' && demoSetting.value !== null) {
          this.is_demo_mode = !!(demoSetting.value as { enabled?: boolean }).enabled;
        }

        // Mirror to local disk cache for seamless offline resiliency
        this.saveToDisk();
        console.log(`[Dual-Mode DB] Hydrated ${this.reports.length} reports from PostgreSQL.`);
      } else if (dbReports.length === 0 && this.reports.length > 0) {
        // PostgreSQL is empty but local JSON has records: Auto-seed PostgreSQL
        console.log('[Dual-Mode DB] Empty PostgreSQL database detected. Seeding from local JSON store...');
        const { syncJsonToPostgres } = await import('../db/sync');
        await syncJsonToPostgres();
      }

      return true;
    } catch (err) {
      console.warn('[Dual-Mode DB] PostgreSQL initialization failed. Operating in JSON fallback mode:', err);
      this.isPostgresActive = false;
      return false;
    } finally {
      this.isInitializingPostgres = false;
    }
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data: DatabaseSchema = JSON.parse(raw);
        this.reports = data.reports || [];
        this.patterns = data.patterns || [];
        this.alerts = data.alerts || [];
        this.feedback = data.feedback || [];
        this.thresholds = data.thresholds || { ...DEFAULT_THRESHOLDS };
        this.is_demo_mode = !!data.is_demo_mode;
      } else {
        this.reports = [];
        this.patterns = [];
        this.alerts = [];
        this.feedback = [];
        this.thresholds = { ...DEFAULT_THRESHOLDS };
        this.is_demo_mode = false;
        this.saveToDisk();
      }
    } catch (err) {
      console.error('Failed to load database from disk, starting empty:', err);
      this.reports = [];
      this.patterns = [];
      this.alerts = [];
      this.feedback = [];
      this.thresholds = { ...DEFAULT_THRESHOLDS };
      this.is_demo_mode = false;
    }
  }

  private saveToDisk(): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const data: DatabaseSchema = {
        reports: this.reports,
        patterns: this.patterns,
        alerts: this.alerts,
        feedback: this.feedback,
        thresholds: this.thresholds,
        is_demo_mode: this.is_demo_mode,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  // Getters
  public getReports(): Report[] {
    return [...this.reports];
  }

  public getReportById(id: string): Report | undefined {
    return this.reports.find((r) => r.id === id);
  }

  public getPatterns(): PrecursorPattern[] {
    return [...this.patterns];
  }

  public getPatternById(id: string): PrecursorPattern | undefined {
    return this.patterns.find((p) => p.id === id);
  }

  public getAlerts(): HSEAlert[] {
    return [...this.alerts];
  }

  public getFeedback(): HSEFeedback[] {
    return [...this.feedback];
  }

  public getThresholds(): ModelThresholds {
    return { ...this.thresholds };
  }

  public isDemoMode(): boolean {
    return this.is_demo_mode;
  }

  public isPostgresConnected(): boolean {
    return this.isPostgresActive;
  }

  // Actions
  public addReport(report: Report): Report {
    if (report.is_demo === undefined) {
      report.is_demo = this.is_demo_mode;
    }
    this.reports.unshift(report);
    this.recalculatePatterns();
    this.evaluateAlertsForReport(report);
    this.saveToDisk();

    // Write through to PostgreSQL if connected
    if (this.isPostgresActive) {
      const prisma = getPrismaClient();
      if (prisma) {
        prisma.report
          .upsert({
            where: { id: report.id },
            update: {
              report_text: report.report_text,
              report_type: report.report_type,
              site: report.site,
              date: report.date,
              activity: report.activity,
              location: report.location,
              hazard: report.hazard,
              barrier_failure: report.barrier_failure,
              sif_potential: report.sif_potential,
              sif_score: report.sif_score,
              life_saving_rule: report.life_saving_rule,
              sif_precursor: report.sif_precursor,
              explanation: report.explanation,
              evidence: report.evidence || [],
              recommended_actions: report.recommended_actions as unknown as object,
              review_status: report.review_status || 'Pending Review',
              reviewer_comment: report.reviewer_comment || null,
              corrected_sif_potential: report.corrected_sif_potential || null,
              is_demo: !!report.is_demo,
            },
            create: {
              id: report.id,
              report_text: report.report_text,
              report_type: report.report_type,
              site: report.site,
              date: report.date,
              activity: report.activity,
              location: report.location,
              hazard: report.hazard,
              barrier_failure: report.barrier_failure,
              sif_potential: report.sif_potential,
              sif_score: report.sif_score,
              life_saving_rule: report.life_saving_rule,
              sif_precursor: report.sif_precursor,
              explanation: report.explanation,
              evidence: report.evidence || [],
              recommended_actions: report.recommended_actions as unknown as object,
              review_status: report.review_status || 'Pending Review',
              reviewer_comment: report.reviewer_comment || null,
              corrected_sif_potential: report.corrected_sif_potential || null,
              is_demo: !!report.is_demo,
              created_at: report.created_at ? new Date(report.created_at) : new Date(),
              updated_at: report.updated_at ? new Date(report.updated_at) : new Date(),
            },
          })
          .catch((err) => console.warn('[Dual-Mode DB] Async report write to PostgreSQL failed:', err));
      }
    }

    return report;
  }

  public addBatchReports(newReports: Report[]): Report[] {
    for (const r of newReports) {
      if (r.is_demo === undefined) {
        r.is_demo = this.is_demo_mode;
      }
      this.reports.unshift(r);
      this.evaluateAlertsForReport(r);
    }
    this.recalculatePatterns();
    this.saveToDisk();

    if (this.isPostgresActive) {
      const prisma = getPrismaClient();
      if (prisma) {
        Promise.all(
          newReports.map((report) =>
            prisma.report.upsert({
              where: { id: report.id },
              update: {
                report_text: report.report_text,
                report_type: report.report_type,
                site: report.site,
                date: report.date,
                activity: report.activity,
                location: report.location,
                hazard: report.hazard,
                barrier_failure: report.barrier_failure,
                sif_potential: report.sif_potential,
                sif_score: report.sif_score,
                life_saving_rule: report.life_saving_rule,
                sif_precursor: report.sif_precursor,
                explanation: report.explanation,
                evidence: report.evidence || [],
                recommended_actions: report.recommended_actions as unknown as object,
                review_status: report.review_status || 'Pending Review',
                is_demo: !!report.is_demo,
              },
              create: {
                id: report.id,
                report_text: report.report_text,
                report_type: report.report_type,
                site: report.site,
                date: report.date,
                activity: report.activity,
                location: report.location,
                hazard: report.hazard,
                barrier_failure: report.barrier_failure,
                sif_potential: report.sif_potential,
                sif_score: report.sif_score,
                life_saving_rule: report.life_saving_rule,
                sif_precursor: report.sif_precursor,
                explanation: report.explanation,
                evidence: report.evidence || [],
                recommended_actions: report.recommended_actions as unknown as object,
                review_status: report.review_status || 'Pending Review',
                is_demo: !!report.is_demo,
                created_at: report.created_at ? new Date(report.created_at) : new Date(),
                updated_at: report.updated_at ? new Date(report.updated_at) : new Date(),
              },
            })
          )
        ).catch((err) => console.warn('[Dual-Mode DB] Async batch write to PostgreSQL failed:', err));
      }
    }

    return newReports;
  }

  public updateReportStatus(
    id: string,
    status: Report['review_status'],
    comment?: string,
    correctedSif?: SIFPotential
  ): Report | null {
    const report = this.reports.find((r) => r.id === id);
    if (!report) return null;

    report.review_status = status;
    if (comment) report.reviewer_comment = comment;
    if (correctedSif) {
      report.corrected_sif_potential = correctedSif;
      report.sif_potential = correctedSif;
    }
    report.updated_at = new Date().toISOString();
    this.recalculatePatterns();
    this.saveToDisk();

    if (this.isPostgresActive) {
      const prisma = getPrismaClient();
      if (prisma) {
        prisma.report
          .update({
            where: { id },
            data: {
              review_status: status,
              reviewer_comment: comment || null,
              corrected_sif_potential: correctedSif || null,
              sif_potential: report.sif_potential,
              updated_at: new Date(),
            },
          })
          .catch((err) => console.warn('[Dual-Mode DB] Async update to PostgreSQL failed:', err));
      }
    }

    return report;
  }

  public addFeedback(item: Omit<HSEFeedback, 'id' | 'created_at'>): HSEFeedback {
    const feedbackRecord: HSEFeedback = {
      ...item,
      id: `FB-${Math.floor(100 + Math.random() * 900)}`,
      created_at: new Date().toISOString(),
    };
    this.feedback.unshift(feedbackRecord);

    const report = this.reports.find((r) => r.id === item.report_id);
    if (report) {
      report.sif_potential = item.hse_correction.sif_potential;
      report.life_saving_rule = item.hse_correction.life_saving_rule;
      report.sif_precursor = item.hse_correction.sif_precursor;
      report.barrier_failure = item.hse_correction.barrier_failure;
      report.review_status = 'Corrected';
      report.reviewer_comment = item.reviewer_comment;
      report.updated_at = new Date().toISOString();
    }

    this.recalculatePatterns();
    this.saveToDisk();

    if (this.isPostgresActive) {
      const prisma = getPrismaClient();
      if (prisma) {
        prisma.hSEFeedback
          .create({
            data: {
              id: feedbackRecord.id,
              report_id: feedbackRecord.report_id,
              ai_prediction: feedbackRecord.ai_prediction as unknown as object,
              hse_correction: feedbackRecord.hse_correction as unknown as object,
              reviewer_comment: feedbackRecord.reviewer_comment,
              reviewer_name: feedbackRecord.reviewer_name,
              created_at: new Date(feedbackRecord.created_at),
            },
          })
          .catch((err) => console.warn('[Dual-Mode DB] Async feedback write to PostgreSQL failed:', err));

        if (report) {
          prisma.report
            .update({
              where: { id: report.id },
              data: {
                sif_potential: report.sif_potential,
                life_saving_rule: report.life_saving_rule,
                sif_precursor: report.sif_precursor,
                barrier_failure: report.barrier_failure,
                review_status: 'Corrected',
                reviewer_comment: report.reviewer_comment || null,
                updated_at: new Date(),
              },
            })
            .catch((err) => console.warn('[Dual-Mode DB] Async report update to PostgreSQL failed:', err));
        }
      }
    }

    return feedbackRecord;
  }

  public updateAlertStatus(id: string, status: HSEAlert['status']): HSEAlert | null {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return null;
    alert.status = status;
    if (status === 'RESOLVED') {
      alert.resolved_at = new Date().toISOString();
    }
    this.saveToDisk();

    if (this.isPostgresActive) {
      const prisma = getPrismaClient();
      if (prisma) {
        prisma.hSEAlert
          .update({
            where: { id },
            data: {
              status,
              resolved_at: alert.resolved_at ? new Date(alert.resolved_at) : null,
            },
          })
          .catch((err) => console.warn('[Dual-Mode DB] Async alert update to PostgreSQL failed:', err));
      }
    }

    return alert;
  }

  public updateThresholds(newThresholds: Partial<ModelThresholds>): ModelThresholds {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    for (const report of this.reports) {
      if (!report.corrected_sif_potential) {
        if (report.sif_score >= this.thresholds.high) {
          report.sif_potential = 'HIGH';
        } else if (report.sif_score >= this.thresholds.medium) {
          report.sif_potential = 'MEDIUM';
        } else {
          report.sif_potential = 'LOW';
        }
      }
    }
    this.recalculatePatterns();
    this.saveToDisk();

    if (this.isPostgresActive) {
      const prisma = getPrismaClient();
      if (prisma) {
        prisma.systemSetting
          .upsert({
            where: { key: 'thresholds' },
            update: { value: this.thresholds as unknown as object },
            create: { key: 'thresholds', value: this.thresholds as unknown as object },
          })
          .catch((err) => console.warn('[Dual-Mode DB] Async thresholds update to PostgreSQL failed:', err));
      }
    }

    return { ...this.thresholds };
  }

  // Demo Mode Handlers
  public loadDemoDataset(): void {
    const realReports = this.reports.filter((r) => !r.is_demo);
    const realAlerts = this.alerts.filter((a) => !a.is_demo);
    const realPatterns = this.patterns.filter((p) => !p.is_demo);

    const demoReports = INITIAL_DEMO_REPORTS.map((r) => ({ ...r, is_demo: true }));
    const demoAlerts = INITIAL_HSE_ALERTS.map((a) => ({ ...a, is_demo: true }));
    const demoPatterns = INITIAL_PRECURSOR_PATTERNS.map((p) => ({ ...p, is_demo: true }));
    const demoFeedback = INITIAL_HSE_FEEDBACK.map((f) => ({ ...f }));

    this.reports = [...demoReports, ...realReports];
    this.alerts = [...demoAlerts, ...realAlerts];
    this.patterns = [...demoPatterns, ...realPatterns];
    this.feedback = [...demoFeedback, ...this.feedback.filter((f) => !f.id.startsWith('FB-50'))];
    this.is_demo_mode = true;
    this.saveToDisk();

    if (this.isPostgresActive) {
      import('../db/sync')
        .then(({ syncJsonToPostgres }) => syncJsonToPostgres())
        .catch((err) => console.warn('[Dual-Mode DB] Demo sync to PostgreSQL failed:', err));
    }
  }

  public resetToDemoData(): void {
    this.loadDemoDataset();
  }

  public clearDemoDataset(): void {
    this.reports = this.reports.filter((r) => !r.is_demo);
    this.alerts = this.alerts.filter((a) => !a.is_demo);
    this.patterns = this.patterns.filter((p) => !p.is_demo);
    this.feedback = this.feedback.filter((f) => !f.id.startsWith('FB-50'));
    this.is_demo_mode = false;
    this.recalculatePatterns();
    this.saveToDisk();

    if (this.isPostgresActive) {
      const prisma = getPrismaClient();
      if (prisma) {
        Promise.all([
          prisma.report.deleteMany({ where: { is_demo: true } }),
          prisma.hSEAlert.deleteMany({ where: { is_demo: true } }),
          prisma.precursorPattern.deleteMany({ where: { is_demo: true } }),
        ]).catch((err) => console.warn('[Dual-Mode DB] Delete demo from PostgreSQL failed:', err));
      }
    }
  }

  public clearAllData(): void {
    this.reports = [];
    this.patterns = [];
    this.alerts = [];
    this.feedback = [];
    this.thresholds = { ...DEFAULT_THRESHOLDS };
    this.is_demo_mode = false;
    this.saveToDisk();

    if (this.isPostgresActive) {
      const prisma = getPrismaClient();
      if (prisma) {
        Promise.all([
          prisma.report.deleteMany(),
          prisma.precursorPattern.deleteMany(),
          prisma.hSEAlert.deleteMany(),
          prisma.hSEFeedback.deleteMany(),
        ]).catch((err) => console.warn('[Dual-Mode DB] Clear all from PostgreSQL failed:', err));
      }
    }
  }

  private evaluateAlertsForReport(report: Report) {
    if (report.sif_potential === 'HIGH') {
      const alertId = `ALT-${Math.floor(800 + Math.random() * 200)}`;

      const similarReports = this.reports.filter(
        (r) =>
          r.site === report.site &&
          r.life_saving_rule === report.life_saving_rule &&
          r.sif_potential === 'HIGH' &&
          r.id !== report.id
      );

      const triggerText =
        similarReports.length >= 1
          ? `Cluster Alert: Multiple High SIF reports flagged for '${report.life_saving_rule}' at ${report.site}.`
          : `Critical SIF Precursor Flagged: '${report.life_saving_rule}' exposure detected at ${report.site}.`;

      const newAlert: HSEAlert = {
        id: alertId,
        severity: 'HIGH',
        trigger: triggerText,
        report_id: report.id,
        site: report.site,
        activity: report.activity,
        precursor: report.sif_precursor,
        status: 'ACTIVE',
        is_demo: report.is_demo,
        created_at: new Date().toISOString(),
        assigned_to: 'Asset HSE Lead',
      };

      this.alerts.unshift(newAlert);

      if (this.isPostgresActive) {
        const prisma = getPrismaClient();
        if (prisma) {
          prisma.hSEAlert
            .create({
              data: {
                id: newAlert.id,
                severity: newAlert.severity,
                trigger: newAlert.trigger,
                report_id: newAlert.report_id || null,
                site: newAlert.site,
                activity: newAlert.activity,
                precursor: newAlert.precursor,
                status: newAlert.status,
                is_demo: !!newAlert.is_demo,
                assigned_to: newAlert.assigned_to || null,
                created_at: new Date(newAlert.created_at),
              },
            })
            .catch((err) => console.warn('[Dual-Mode DB] Async alert create to PostgreSQL failed:', err));
        }
      }
    }
  }

  private recalculatePatterns() {
    if (this.reports.length < 2) {
      this.patterns = [];
      return;
    }

    const groups = new Map<
      string,
      {
        activity: string;
        location: string;
        barrier_failure: string;
        life_saving_rule: Report['life_saving_rule'];
        hazard: string;
        reportIds: string[];
        sifCount: number;
      }
    >();

    for (const r of this.reports) {
      const key = `${r.activity}|||${r.barrier_failure}`;
      if (!groups.has(key)) {
        groups.set(key, {
          activity: r.activity,
          location: r.location,
          barrier_failure: r.barrier_failure,
          life_saving_rule: r.life_saving_rule,
          hazard: r.hazard,
          reportIds: [],
          sifCount: 0,
        });
      }
      const entry = groups.get(key)!;
      entry.reportIds.push(r.id);
      if (r.sif_potential === 'HIGH' || r.sif_potential === 'MEDIUM') {
        entry.sifCount++;
      }
    }

    const updatedPatterns: PrecursorPattern[] = [];
    let idx = 1;
    for (const [, val] of Array.from(groups.entries())) {
      if (val.reportIds.length >= 2 || (this.reports.length >= 3 && val.sifCount >= 1)) {
        const frequency = val.reportIds.length;
        const sif_density = Math.round((val.sifCount / frequency) * 100) / 100;

        updatedPatterns.push({
          id: `PAT-${String(idx).padStart(2, '0')}`,
          pattern_name: `${val.life_saving_rule} Barrier Deviation (${val.activity})`,
          activity: val.activity,
          location: val.location,
          barrier_failure: val.barrier_failure,
          frequency,
          sif_count: val.sifCount,
          sif_density,
          trend: sif_density >= 0.75 ? 'up' : sif_density >= 0.5 ? 'stable' : 'down',
          associated_hazard: val.hazard,
          life_saving_rule: val.life_saving_rule,
          representative_report_ids: val.reportIds.slice(0, 3),
          recommended_intervention: `Mandate dedicated verification check and engineered safeguard for ${val.barrier_failure.toLowerCase()}.`,
          created_at: new Date().toISOString(),
          is_demo: this.is_demo_mode,
        });
        idx++;
      }
    }

    updatedPatterns.sort((a, b) => b.sif_density - a.sif_density || b.frequency - a.frequency);
    this.patterns = updatedPatterns;

    if (this.isPostgresActive) {
      const prisma = getPrismaClient();
      if (prisma) {
        Promise.all(
          this.patterns.map((p) =>
            prisma.precursorPattern.upsert({
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
                representative_report_ids: p.representative_report_ids,
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
                representative_report_ids: p.representative_report_ids,
                recommended_intervention: p.recommended_intervention,
                is_demo: !!p.is_demo,
                created_at: new Date(p.created_at),
              },
            })
          )
        ).catch((err) => console.warn('[Dual-Mode DB] Pattern sync to PostgreSQL failed:', err));
      }
    }
  }
}

// Global Singleton instance for server-side state in Next.js
declare global {
  // eslint-disable-next-line no-var
  var __reportsStore: ReportsStore | undefined;
}

export const reportsStore = global.__reportsStore || new ReportsStore();
if (process.env.NODE_ENV !== 'production') {
  global.__reportsStore = reportsStore;
}
