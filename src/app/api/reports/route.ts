import { NextRequest, NextResponse } from 'next/server';
import { reportsStore } from '@/lib/store/reports_store';
import { Report } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.toLowerCase() || '';
    const sif = searchParams.get('sif') || '';
    const rule = searchParams.get('rule') || '';
    const site = searchParams.get('site') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let list = reportsStore.getReports();

    if (q) {
      list = list.filter(
        r =>
          r.id.toLowerCase().includes(q) ||
          r.report_text.toLowerCase().includes(q) ||
          r.activity.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.hazard.toLowerCase().includes(q) ||
          r.sif_precursor.toLowerCase().includes(q)
      );
    }

    if (sif) {
      list = list.filter(r => r.sif_potential.toLowerCase() === sif.toLowerCase());
    }

    if (rule) {
      list = list.filter(r => r.life_saving_rule.toLowerCase() === rule.toLowerCase());
    }

    if (site) {
      list = list.filter(r => r.site.toLowerCase() === site.toLowerCase());
    }

    if (type) {
      list = list.filter(r => r.report_type.toLowerCase() === type.toLowerCase());
    }

    if (status) {
      list = list.filter(r => r.review_status.toLowerCase() === status.toLowerCase());
    }

    const total = list.length;
    const paginated = list.slice(offset, offset + limit);

    return NextResponse.json({
      total,
      offset,
      limit,
      reports: paginated,
    });
  } catch (error) {
    console.error('Error in GET /api/reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const reportData = (await req.json()) as Report;
    if (!reportData.report_text) {
      return NextResponse.json({ error: 'report_text required' }, { status: 400 });
    }
    const saved = reportsStore.addReport(reportData);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/reports:', error);
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}
