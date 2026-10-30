import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { getOrCompileMonthlyReport } from '@/lib/financial-report-service';
import { generateFinancialReportPdfBuffer } from '@/lib/financial-report-pdf';
import { sendMonthlyReportEmail } from '@/lib/email';
import { db } from '@/db';
import { allowedUsers, monthlyFinancialReports } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ month: string }> }
) {
  const authRes = await requirePermission('reports:generate');
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status || 401 });
  }

  const { month } = await props.params;

  try {
    const reportData = await getOrCompileMonthlyReport(month);
    const pdfBuffer = await generateFinancialReportPdfBuffer(reportData);

    // Get recipients
    const recipientsRaw = await db
      .select({ email: allowedUsers.email })
      .from(allowedUsers)
      .where(sql`${allowedUsers.role} IN ('SUPER_ADMIN', 'ADMIN')`);

    let recipientEmails = recipientsRaw.map((r) => r.email).filter(Boolean) as string[];
    if (recipientEmails.length === 0) {
      recipientEmails = ['blactifyofficial@gmail.com'];
    }

    const emailResult = await sendMonthlyReportEmail({
      recipients: recipientEmails,
      reportData,
      pdfBuffer,
    });

    if (emailResult.success) {
      await db
        .update(monthlyFinancialReports)
        .set({
          emailSentAt: new Date(),
          emailRecipients: JSON.stringify(recipientEmails),
          updatedAt: new Date(),
        })
        .where(eq(monthlyFinancialReports.month, month));

      return NextResponse.json({
        message: `Report email for ${month} sent successfully`,
        recipients: recipientEmails,
      });
    } else {
      return NextResponse.json(
        { error: emailResult.error || 'Failed to dispatch email' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send report email';
    console.error(`Error sending email for ${month}:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

