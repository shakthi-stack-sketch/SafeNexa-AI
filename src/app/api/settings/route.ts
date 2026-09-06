import { NextRequest, NextResponse } from 'next/server';
import { reportsStore } from '@/lib/store/reports_store';
import { ALL_LIFE_SAVING_RULES } from '@/lib/rules/iogp_rules';
import { verifySessionToken } from '@/lib/auth/crypto';
import { getDatabaseStatus } from '@/lib/db/prisma';
import { syncJsonToPostgres } from '@/lib/db/sync';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const thresholds = reportsStore.getThresholds();
    const databaseStatus = await getDatabaseStatus();

    return NextResponse.json({
      thresholds,
      rules: ALL_LIFE_SAVING_RULES,
      isDemo: reportsStore.isDemoMode(),
      database: databaseStatus,
    });
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Role check: Administrator only
    const sessionCookie = req.cookies.get('safenexa_session')?.value;
    const session = sessionCookie ? verifySessionToken(sessionCookie) : null;
    if (!session || session.role !== 'Administrator') {
      return NextResponse.json(
        { error: 'Forbidden: Administrator authorization required to modify system settings.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, thresholds } = body;

    if (action === 'reset_demo') {
      reportsStore.loadDemoDataset();
      return NextResponse.json({ success: true, message: 'Reset to demo baseline complete' });
    }

    if (action === 'sync_postgres') {
      const result = await syncJsonToPostgres();
      const updatedStatus = await getDatabaseStatus();
      return NextResponse.json({
        success: result.success,
        message: result.message,
        synced: result.synced,
        errors: result.errors,
        database: updatedStatus,
      });
    }

    if (thresholds) {
      const updated = reportsStore.updateThresholds(thresholds);
      return NextResponse.json({ success: true, thresholds: updated });
    }

    return NextResponse.json({ error: 'Invalid action or parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
