import { NextRequest, NextResponse } from 'next/server';
import { reportsStore } from '@/lib/store/reports_store';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const report = reportsStore.getReportById(params.id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    return NextResponse.json(report);
  } catch (error) {
    console.error(`Error in GET /api/reports/${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, comment, corrected_sif_potential } = body;

    const updated = reportsStore.updateReportStatus(
      params.id,
      status,
      comment,
      corrected_sif_potential
    );

    if (!updated) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`Error in PATCH /api/reports/${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
