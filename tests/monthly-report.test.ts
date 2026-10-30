import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseMonthString,
  getPreviousMonthString,
  getReportReleaseDateString,
  type FinancialReportData,
} from '../src/lib/financial-report-service';
import { buildFinancialReportPdf, generateFinancialReportPdfBuffer } from '../src/lib/financial-report-pdf';
import { hasPermission, canAccessRoute } from '../src/lib/rbac';

describe('Monthly Financial Report Service & Date Calculations', () => {
  test('should parse valid month string correctly', () => {
    const { year, month } = parseMonthString('2026-10');
    assert.equal(year, 2026);
    assert.equal(month, 10);

    const dec = parseMonthString('2025-12');
    assert.equal(dec.year, 2025);
    assert.equal(dec.month, 12);
  });

  test('should throw error on invalid month strings', () => {
    assert.throws(() => parseMonthString('invalid-date'), /Invalid month string/);
    assert.throws(() => parseMonthString('2026-13'), /Invalid month string/);
    assert.throws(() => parseMonthString('2026-00'), /Invalid month string/);
  });

  test('should calculate previous month string correctly including year boundaries', () => {
    // Reference: Nov 1, 2026 in IST (+05:30)
    const nov1 = new Date('2026-11-01T04:00:00.000Z');
    const prevFromNov = getPreviousMonthString(nov1);
    assert.equal(prevFromNov, '2026-10');

    // Reference: Jan 1, 2027 in IST
    const jan1 = new Date('2027-01-01T04:00:00.000Z');
    const prevFromJan = getPreviousMonthString(jan1);
    assert.equal(prevFromJan, '2026-12');
  });

  test('should format release date as the 1st day of the following month', () => {
    // October 2026 -> release date is November 1, 2026
    const releaseOct = getReportReleaseDateString(2026, 10);
    assert.equal(releaseOct, 'November 1, 2026');

    // December 2026 -> release date is January 1, 2027
    const releaseDec = getReportReleaseDateString(2026, 12);
    assert.equal(releaseDec, 'January 1, 2027');
  });
});

describe('Financial Report PDF Generator', () => {
  const mockReportData: FinancialReportData = {
    meta: {
      id: 'rep_2026_10',
      month: '2026-10',
      monthDisplay: 'October 2026',
      year: 2026,
      monthNumber: 10,
      startDate: '2026-09-30T18:30:00.000Z',
      endDate: '2026-10-31T18:30:00.000Z',
      reportReleaseDate: 'November 1, 2026',
      currency: 'INR',
      status: 'COMPLETED',
      generatedAt: '2026-11-01T06:00:00.000Z',
    },
    kpis: {
      totalRevenue: 132939.3,
      totalOrders: 112,
      aov: 1186.96,
      totalExpenses: 139395.28,
      netProfit: -6455.98,
      profitMargin: -4.9,
      mom: {
        revenueGrowthPct: 35.4,
        ordersGrowthPct: 36.6,
        profitGrowthPct: -149.3,
        prevRevenue: 98200,
        prevExpenses: 85100,
        prevNetProfit: 13100,
        prevOrders: 82,
      },
    },
    sales: {
      prepaid: {
        count: 52,
        revenue: 65000,
        percentage: 48.9,
      },
      cod: {
        count: 60,
        revenue: 67939.3,
        percentage: 51.1,
        collectedAmount: 62000,
        pendingAmount: 5939.3,
      },
      topProducts: [
        { title: 'Kushka', quantity: 37, revenue: 24175.8, percentage: 18.2 },
        { title: 'Ch', quantity: 17, revenue: 13286.7, percentage: 10.0 },
      ],
      dailyBreakdown: [
        { day: 1, dateStr: '2026-10-01', revenue: 4500, ordersCount: 4 },
      ],
    },
    expenses: {
      total: 139395.28,
      operationalExpenses: 139395.28,
      monthlyBillsAmount: 24000,
      adSpendAmount: 18900,
      categories: [
        { category: 'Purchases', amount: 91500, percentage: 65.6, count: 17 },
        { category: 'Meta Ads.', amount: 18900, percentage: 13.6, count: 3 },
      ],
      monthlyBills: [
        { name: 'Shopify Subscription', category: 'Software', expectedAmount: 4000, actualAmount: 4000, status: 'PAID' },
      ],
    },
    capital: {
      totalInvestments: 50000,
      totalWithdrawals: 10000,
      totalPayouts: 25000,
      transactionsCount: 3,
    },
    executiveNotes: [
      'Gross sales for October 2026 totaled Rs. 1,32,939.30 across 112 customer orders.',
      'Primary operational expenditure driver was Purchases at Rs. 91,500.00.',
    ],
  };

  test('should build valid multi-page jsPDF instance', () => {
    const doc = buildFinancialReportPdf(mockReportData);
    assert.ok(doc, 'Doc should be defined');
    assert.equal(doc.getNumberOfPages() >= 2, true, 'Report should span at least 2 pages');
  });

  test('should generate valid non-empty PDF Buffer', async () => {
    const buffer = await generateFinancialReportPdfBuffer(mockReportData);
    assert.ok(buffer, 'Buffer should be defined');
    assert.ok(Buffer.isBuffer(buffer), 'Should be an instance of Node Buffer');
    assert.ok(buffer.length > 5000, 'PDF buffer should be sufficiently populated (>5KB)');
  });
});

describe('Reports RBAC & Route Access Guard', () => {
  test('SUPER_ADMIN should have full reports view, export, and generate permissions', () => {
    assert.equal(hasPermission('SUPER_ADMIN', 'reports:view'), true);
    assert.equal(hasPermission('SUPER_ADMIN', 'reports:export'), true);
    assert.equal(hasPermission('SUPER_ADMIN', 'reports:generate'), true);
  });

  test('ADMIN should have reports view, export, and generate permissions', () => {
    assert.equal(hasPermission('ADMIN', 'reports:view'), true);
    assert.equal(hasPermission('ADMIN', 'reports:export'), true);
    assert.equal(hasPermission('ADMIN', 'reports:generate'), true);
  });

  test('PARTNER and VIEWER roles should have read/export access but not generation', () => {
    assert.equal(hasPermission('PARTNER', 'reports:view'), true);
    assert.equal(hasPermission('PARTNER', 'reports:export'), true);
    assert.equal(hasPermission('PARTNER', 'reports:generate'), false);

    assert.equal(hasPermission('VIEWER', 'reports:view'), true);
    assert.equal(hasPermission('VIEWER', 'reports:export'), false);
    assert.equal(hasPermission('VIEWER', 'reports:generate'), false);
  });

  test('canAccessRoute should allow authorized roles to access /reports and /reports/[month]', () => {
    assert.equal(canAccessRoute('SUPER_ADMIN', '/reports'), true);
    assert.equal(canAccessRoute('ADMIN', '/reports'), true);
    assert.equal(canAccessRoute('VIEWER', '/reports'), true);
    assert.equal(canAccessRoute('SUPER_ADMIN', '/reports/2026-10'), true);
    assert.equal(canAccessRoute('ADMIN', '/reports/2026-10'), true);
  });
});

