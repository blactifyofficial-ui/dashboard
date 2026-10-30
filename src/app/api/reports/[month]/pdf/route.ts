import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { getOrCompileMonthlyReport } from '@/lib/financial-report-service';
import { generateFinancialReportPdfBuffer } from '@/lib/financial-report-pdf';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ month: string }> }
) {
  const authRes = await requirePermission('reports:view');
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status || 401 });
  }

  const { month } = await props.params;

  try {
    const reportData = await getOrCompileMonthlyReport(month);
    const pdfBuffer = await generateFinancialReportPdfBuffer(reportData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Blactify-Financial-Report-${month}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
    console.error(`Error generating PDF report for ${month}:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
