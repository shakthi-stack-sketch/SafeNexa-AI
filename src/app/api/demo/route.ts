import { NextRequest, NextResponse } from 'next/server';
import { reportsStore } from '@/lib/store/reports_store';
import { verifySessionToken } from '@/lib/auth/crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isDemo = reportsStore.isDemoMode();
    const reports = reportsStore.getReports();
    const demoCount = reports.filter(r => r.is_demo).length;
    const realCount = reports.filter(r => !r.is_demo).length;

    return NextResponse.json({
      is_demo_mode: isDemo,
      demo_count: demoCount,
      real_count: realCount,
      total_count: reports.length,
    });
  } catch (error) {
    console.error('Error in GET /api/demo:', error);
    return NextResponse.json({ error: 'Failed to fetch demo state' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Role check: Administrator authorization required
    const sessionCookie = req.cookies.get('safenexa_session')?.value;
    const session = sessionCookie ? verifySessionToken(sessionCookie) : null;
    if (!session || session.role !== 'Administrator') {
      return NextResponse.json(
        { error: 'Forbidden: Administrator authorization required to manage system datasets.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'load') {
      reportsStore.loadDemoDataset();
      return NextResponse.json({
        success: true,
        message: 'Demo dataset loaded for demonstration purposes (marked as DEMO DATA).',
        is_demo_mode: true,
        total_reports: reportsStore.getReports().length,
      });
    }

    if (action === 'clear_demo') {
      reportsStore.clearDemoDataset();
      return NextResponse.json({
        success: true,
        message: 'Demo dataset cleared. Only real uploaded records remain.',
        is_demo_mode: false,
        total_reports: reportsStore.getReports().length,
      });
    }

    if (action === 'clear_all') {
      reportsStore.clearAllData();
      return NextResponse.json({
        success: true,
        message: 'All database records cleared.',
        is_demo_mode: false,
        total_reports: 0,
      });
    }

    return NextResponse.json({ error: 'Invalid demo action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/demo:', error);
    return NextResponse.json({ error: 'Failed to process demo action' }, { status: 500 });
  }
}
