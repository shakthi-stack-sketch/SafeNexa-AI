import { NextRequest, NextResponse } from 'next/server';
import { analyzeReport } from '@/lib/nlp/engine';
import { reportsStore } from '@/lib/store/reports_store';
import { Report, ReportType, BatchIngestSummary } from '@/lib/types';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let parsedEntries: {
      text: string;
      type?: ReportType;
      site?: string;
      date?: string;
      activity?: string;
    }[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const textCol = (formData.get('col_text') as string) || 'report_text';
      const typeCol = (formData.get('col_type') as string) || 'report_type';
      const siteCol = (formData.get('col_site') as string) || 'site';
      const dateCol = (formData.get('col_date') as string) || 'date';

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded in batch request' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      for (const row of rows) {
        // Find text column flexibly
        let text = row[textCol] || row['report_text'] || row['narrative'] || row['description'] || row['Text'] || '';
        if (!text) {
          // Look for any column containing 'text' or 'desc'
          for (const key of Object.keys(row)) {
            if (/text|narrative|desc|observation/i.test(key)) {
              text = row[key];
              break;
            }
          }
        }

        if (text && typeof text === 'string' && text.trim().length > 5) {
          const type = (row[typeCol] || row['report_type'] || row['type'] || 'Near Miss') as ReportType;
          const site = row[siteCol] || row['site'] || row['location'] || 'Moran Tank Farm';
          const date = row[dateCol] || row['date'] || new Date().toISOString().split('T')[0];

          parsedEntries.push({
            text: text.trim(),
            type,
            site: String(site).trim(),
            date: String(date).trim(),
          });
        }
      }
    } else {
      const body = await req.json();
      const { items, raw_csv } = body;

      if (Array.isArray(items)) {
        for (const it of items) {
          if (it && typeof it.text === 'string' && it.text.trim().length > 5) {
            parsedEntries.push({
              text: it.text.trim(),
              type: it.type || 'Near Miss',
              site: it.site || 'Duliajan CPF',
              date: it.date || new Date().toISOString().split('T')[0],
              activity: it.activity,
            });
          }
        }
      } else if (typeof raw_csv === 'string') {
        const workbook = XLSX.read(raw_csv, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        for (const row of rows) {
          let text = row['report_text'] || row['text'] || row['narrative'] || row['description'] || '';
          if (!text) {
            for (const key of Object.keys(row)) {
              if (/text|narrative|desc|observation/i.test(key)) {
                text = row[key];
                break;
              }
            }
          }
          if (text && typeof text === 'string' && text.trim().length > 5) {
            parsedEntries.push({
              text: text.trim(),
              type: (row['report_type'] || row['type'] || 'Near Miss') as ReportType,
              site: row['site'] || row['location'] || 'Moran Tank Farm',
              date: row['date'] || new Date().toISOString().split('T')[0],
            });
          }
        }
      }
    }

    if (parsedEntries.length === 0) {
      return NextResponse.json(
        { error: 'No valid safety observation rows found in the uploaded spreadsheet/CSV.' },
        { status: 400 }
      );
    }

    const thresholds = reportsStore.getThresholds();
    const processedReports: Report[] = [];
    let highSif = 0;
    let mediumSif = 0;
    let lowSif = 0;
    let failed = 0;

    for (const entry of parsedEntries) {
      try {
        const result = analyzeReport(
          {
            report_text: entry.text,
            report_type: entry.type || 'Near Miss',
            site: entry.site,
            date: entry.date,
            activity: entry.activity,
          },
          thresholds
        );

        if (result.sif_potential === 'HIGH') highSif++;
        else if (result.sif_potential === 'MEDIUM') mediumSif++;
        else lowSif++;

        const report: Report = {
          id: result.report_id,
          report_text: entry.text,
          report_type: entry.type || 'Near Miss',
          site: entry.site || 'Not identified in the report',
          date: entry.date || new Date().toISOString().split('T')[0],
          activity: result.activity,
          location: result.location,
          hazard: result.hazard,
          barrier_failure: result.barrier_failure,
          sif_potential: result.sif_potential,
          sif_score: result.sif_score,
          life_saving_rule: result.life_saving_rule,
          sif_precursor: result.sif_precursor,
          explanation: result.explanation,
          evidence: result.evidence,
          recommended_actions: result.recommended_actions,
          review_status: 'Pending Review',
          is_demo: false, // Explicitly tagged as real uploaded data
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        processedReports.push(report);
      } catch (err) {
        console.error('Failed to parse entry:', err);
        failed++;
      }
    }

    // Save batch to database
    reportsStore.addBatchReports(processedReports);

    const summary: BatchIngestSummary = {
      totalUploaded: parsedEntries.length,
      processed: processedReports.length,
      highSif,
      mediumSif,
      lowSif,
      failed,
      reports: processedReports,
    };

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/reports/batch:', error);
    return NextResponse.json(
      { error: 'Internal error processing batch spreadsheet ingestion' },
      { status: 500 }
    );
  }
}
