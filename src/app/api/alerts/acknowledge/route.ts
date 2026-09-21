import { NextRequest, NextResponse } from 'next/server';
import { reportsStore } from '@/lib/store/reports_store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, acknowledged_by = 'HSE Lead Officer' } = body;

    if (!id) {
      return NextResponse.json({ error: 'Alert id is required' }, { status: 400 });
    }

    const updated = reportsStore.updateAlertStatus(id, 'ACKNOWLEDGED', {
      acknowledged_by,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      alert: updated,
      message: `Alert ${id} acknowledged by ${acknowledged_by}.`,
      acknowledged_at: updated.acknowledged_at,
    });
  } catch (error) {
    console.error('Error in POST /api/alerts/acknowledge:', error);
    return NextResponse.json({ error: 'Failed to acknowledge alert' }, { status: 500 });
  }
}
