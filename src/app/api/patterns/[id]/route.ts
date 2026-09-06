import { NextRequest, NextResponse } from 'next/server';
import { reportsStore } from '@/lib/store/reports_store';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pattern = reportsStore.getPatternById(params.id);
    if (!pattern) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 });
    }

    // Retrieve related reports
    const relatedReports = pattern.representative_report_ids
      .map(id => reportsStore.getReportById(id))
      .filter(Boolean);

    return NextResponse.json({
      pattern,
      relatedReports,
    });
  } catch (error) {
    console.error(`Error in GET /api/patterns/${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch pattern detail' }, { status: 500 });
  }
}
