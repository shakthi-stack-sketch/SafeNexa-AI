import { NextResponse } from 'next/server';
import { reportsStore } from '@/lib/store/reports_store';

export async function GET() {
  try {
    const patterns = reportsStore.getPatterns();
    return NextResponse.json({
      total: patterns.length,
      patterns,
    });
  } catch (error) {
    console.error('Error in GET /api/patterns:', error);
    return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 });
  }
}
