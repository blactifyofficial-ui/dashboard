import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FinancialReportData } from './financial-report-service';

/**
 * Builds a vector-rendered, multi-page executive PDF report for a given month.
 */
export function buildFinancialReportPdf(data: FinancialReportData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Format currency helper
  const fmtINR = (val: number) => {
    return `Rs. ${val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Header background banner
  const drawPageHeader = () => {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Brand Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BLACTIFY', margin, 13);

    // Subtitle
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('EXECUTIVE FINANCIAL & OPERATIONAL REPORT', margin, 20);

    // Period & Release Date (Right aligned)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(data.meta.monthDisplay.toUpperCase(), pageWidth - margin, 12, { align: 'right' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Period: ${data.meta.monthDisplay} | Released: ${data.meta.reportReleaseDate}`,
      pageWidth - margin,
      19,
      { align: 'right' }
    );
  };

  // Draw header for page 1
  drawPageHeader();

  let currentY = 35;

  // Title section
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Company Financial Summary', margin, currentY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Official financial closure statement for ${data.meta.monthDisplay} (Delivered on ${data.meta.reportReleaseDate})`,
    margin,
    currentY + 5
  );

  currentY += 12;

  // 6 KPI Summary Cards in a 3x2 grid
  const cardWidth = (contentWidth - 8) / 3; // ~58mm each
  const cardHeight = 18;
  const kpiList = [
    {
      title: 'GROSS REVENUE',
      value: fmtINR(data.kpis.totalRevenue),
      sub: `${data.kpis.totalOrders} total orders`,
      color: [15, 23, 42],
    },
    {
      title: 'OPERATING EXPENSES',
      value: fmtINR(data.kpis.totalExpenses),
      sub: `${data.expenses.categories.length} spend categories`,
      color: [15, 23, 42],
    },
    {
      title: 'NET OPERATING PROFIT',
      value: (data.kpis.netProfit < 0 ? '-' : '') + fmtINR(Math.abs(data.kpis.netProfit)),
      sub: `Margin: ${data.kpis.profitMargin >= 0 ? '+' : ''}${data.kpis.profitMargin}%`,
      color: data.kpis.netProfit >= 0 ? [5, 150, 105] : [225, 29, 72], // emerald or rose
    },
    {
      title: 'AVERAGE ORDER VALUE',
      value: fmtINR(data.kpis.aov),
      sub: 'Per customer order',
      color: [15, 23, 42],
    },
    {
      title: 'PREPAID ORDERS',
      value: fmtINR(data.sales.prepaid.revenue),
      sub: `${data.sales.prepaid.count} orders (${data.sales.prepaid.percentage}%)`,
      color: [15, 23, 42],
    },
    {
      title: 'COD ORDERS',
      value: fmtINR(data.sales.cod.revenue),
      sub: `${data.sales.cod.count} orders (${data.sales.cod.percentage}%)`,
      color: [15, 23, 42],
    },
  ];

  kpiList.forEach((kpi, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = margin + col * (cardWidth + 4);
    const y = currentY + row * (cardHeight + 4);

    // Box background & border
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

    // Title
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, x + 3.5, y + 4.5);

    // Value
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3.5, y + 10.5);

    // Sub
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, x + 3.5, y + 15);
  });

  currentY += cardHeight * 2 + 10;

  // Month-over-Month Growth Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Month-over-Month (MoM) Performance', margin, currentY);

  const formatGrowth = (pct: number | null) => {
    if (pct === null) return 'N/A';
    return (pct >= 0 ? '+' : '') + `${pct.toFixed(1)}%`;
  };

  autoTable(doc, {
    startY: currentY + 3,
    margin: { left: margin, right: margin },
    head: [['Financial Metric', 'Current Month', 'Prior Month', 'MoM Change (%)']],
    body: [
      ['Gross Revenue', fmtINR(data.kpis.totalRevenue), fmtINR(data.kpis.mom.prevRevenue), formatGrowth(data.kpis.mom.revenueGrowthPct)],
      ['Operating Expenses', fmtINR(data.kpis.totalExpenses), fmtINR(data.kpis.mom.prevExpenses), '—'],
      ['Net Operating Profit', fmtINR(data.kpis.netProfit), fmtINR(data.kpis.mom.prevNetProfit), formatGrowth(data.kpis.mom.profitGrowthPct)],
      ['Total Orders Count', `${data.kpis.totalOrders}`, `${data.kpis.mom.prevOrders}`, formatGrowth(data.kpis.mom.ordersGrowthPct)],
      ['Average Order Value (AOV)', fmtINR(data.kpis.aov), data.kpis.mom.prevOrders > 0 ? fmtINR(data.kpis.mom.prevRevenue / data.kpis.mom.prevOrders) : '—', '—'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 8;

  // Sales & Payment Channel Breakdown Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Payment & Channel Distribution', margin, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    margin: { left: margin, right: margin },
    head: [['Channel', 'Order Volume', 'Volume Share (%)', 'Gross Value (INR)', 'Revenue Share (%)', 'Collection Status']],
    body: [
      [
        'Prepaid / Online',
        `${data.sales.prepaid.count} orders`,
        data.kpis.totalOrders > 0 ? `${((data.sales.prepaid.count / data.kpis.totalOrders) * 100).toFixed(1)}%` : '0%',
        fmtINR(data.sales.prepaid.revenue),
        `${data.sales.prepaid.percentage}%`,
        '100% Settled',
      ],
      [
        'Cash on Delivery (COD)',
        `${data.sales.cod.count} orders`,
        data.kpis.totalOrders > 0 ? `${((data.sales.cod.count / data.kpis.totalOrders) * 100).toFixed(1)}%` : '0%',
        fmtINR(data.sales.cod.revenue),
        `${data.sales.cod.percentage}%`,
        `Collected: ${fmtINR(data.sales.cod.collectedAmount)} | Pending: ${fmtINR(data.sales.cod.pendingAmount)}`,
      ],
      [
        'TOTALS',
        `${data.kpis.totalOrders} orders`,
        '100%',
        fmtINR(data.kpis.totalRevenue),
        '100%',
        '—',
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.5,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [51, 65, 85],
    },
    footStyles: {
      fontStyle: 'bold',
      fillColor: [241, 245, 249],
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 8;

  // Executive Insights on Page 1 if space permits
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Executive Highlights & Commentary', margin, currentY);

  currentY += 4;
  data.executiveNotes.slice(0, 4).forEach((note) => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const bullet = `* ${note}`;
    const lines = doc.splitTextToSize(bullet, contentWidth);
    doc.text(lines, margin, currentY);
    currentY += lines.length * 3.8 + 1;
  });

  // PAGE 2: Operating Expenses & Top Products
  doc.addPage();
  drawPageHeader();

  currentY = 35;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Operating Expenses Breakdown by Category', margin, currentY);

  const expTableRows = data.expenses.categories.map((c, i) => [
    `${i + 1}`,
    c.category,
    `${c.count} transactions`,
    fmtINR(c.amount),
    `${c.percentage.toFixed(1)}%`,
  ]);

  if (expTableRows.length === 0) {
    expTableRows.push(['—', 'No recorded expenses for this period', '0', 'Rs. 0.00', '0%']);
  }

  autoTable(doc, {
    startY: currentY + 3,
    margin: { left: margin, right: margin },
    head: [['#', 'Expense Category', 'Transactions', 'Total Spend (INR)', '% of Expenses']],
    body: expTableRows,
    foot: [['', 'TOTAL OPERATING EXPENSES', `${data.expenses.categories.reduce((acc, c) => acc + c.count, 0)} transactions`, fmtINR(data.expenses.total), '100%']],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.2,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    footStyles: {
      fontStyle: 'bold',
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 8;

  // Top Selling Products Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Top 10 Best-Selling Products of the Month', margin, currentY);

  const topProductRows = data.sales.topProducts.map((p, idx) => [
    `#${idx + 1}`,
    p.title,
    `${p.quantity} units`,
    fmtINR(p.revenue),
    `${p.percentage.toFixed(1)}%`,
  ]);

  if (topProductRows.length === 0) {
    topProductRows.push(['—', 'No sales registered for this period', '0', 'Rs. 0.00', '0%']);
  }

  autoTable(doc, {
    startY: currentY + 3,
    margin: { left: margin, right: margin },
    head: [['Rank', 'Product Name', 'Volume Sold', 'Revenue Generated', '% of Total Sales']],
    body: topProductRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.2,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 8;

  // Capital & Corporate Activity
  if (currentY < pageHeight - 35) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Capital & Corporate Cash Flow', margin, currentY);

    autoTable(doc, {
      startY: currentY + 3,
      margin: { left: margin, right: margin },
      head: [['Transaction Type', 'Amount (INR)', 'Description']],
      body: [
        ['Partner Investments', fmtINR(data.capital.totalInvestments), 'Inbound partner capital injections'],
        ['Partner Withdrawals', fmtINR(data.capital.totalWithdrawals), 'Outbound capital drawings'],
        ['Partner Payouts / Distributions', fmtINR(data.capital.totalPayouts), 'Profit share and dividends paid'],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: 2,
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        textColor: [51, 65, 85],
      },
    });
  }

  // Draw Page Footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400

    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.text(
      `Blactify Financial Intelligence System | Strictly Confidential | Generated on ${new Date(
        data.meta.generatedAt
      ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      margin,
      pageHeight - 6
    );

    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 6, {
      align: 'right',
    });
  }

  return doc;
}

/**
 * Returns a Buffer of the generated PDF suitable for email attachments or HTTP streaming.
 */
export async function generateFinancialReportPdfBuffer(data: FinancialReportData): Promise<Buffer> {
  const doc = buildFinancialReportPdf(data);
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

