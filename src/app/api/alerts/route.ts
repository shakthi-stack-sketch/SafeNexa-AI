import { NextRequest, NextResponse } from 'next/server';
import { reportsStore } from '@/lib/store/reports_store';

export async function GET() {
  try {
    const alerts = reportsStore.getAlerts();
    return NextResponse.json({
      total: alerts.length,
      active: alerts.filter(a => a.status === 'ACTIVE').length,
      alerts,
    });
  } catch (error) {
    console.error('Error in GET /api/alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    const updated = reportsStore.updateAlertStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in PATCH /api/alerts:', error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}
