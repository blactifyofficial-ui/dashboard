import { FinancialSnapshot } from './financial-aggregator';

export interface StrategicActionItem {
  title: string;
  category: 'SALES' | 'EXPENSES' | 'ADS' | 'OPS';
  impact: 'HIGH' | 'MEDIUM';
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  detail: string;
}

export interface SyntheticKpiItem {
  label: string;
  value: string;
  status: 'positive' | 'warning' | 'danger' | 'neutral';
  commentary: string;
}

export interface AiStrategicReport {
  healthScore: number;
  healthStatus: 'STRONG' | 'STABLE' | 'VULNERABLE' | 'CRITICAL';
  summary: string;
  syntheticKpis: SyntheticKpiItem[];
  strategicRoadmap: {
    immediateActions: StrategicActionItem[]; // 7 Days
    tacticalMonthly: StrategicActionItem[];  // 30 Days
    quarterlyGrowth: StrategicActionItem[];  // 60-90 Days
  };
  deepDives: {
    salesAndPricing: {
      strengths: string[];
      risks: string[];
      recommendations: string[];
    };
    costOptimization: {
      wasteIdentified: string[];
      savingsOpportunities: string[];
      highestRiskExpense: string;
    };
    marketingAndAds: {
      roasEvaluation: string;
      budgetAdvice: string;
      scalingTactics: string[];
    };
    cashFlowAndCapital: {
      burnRateVerdict: string;
      partnerCapitalAdvice: string;
      runwayAssessment: string;
    };
  };
}

export const AI_ANALYSIS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    healthScore: {
      type: 'NUMBER',
      description: 'Overall business financial health score between 0 and 100',
    },
    healthStatus: {
      type: 'STRING',
      enum: ['STRONG', 'STABLE', 'VULNERABLE', 'CRITICAL'],
      description: 'One-word qualitative health rating',
    },
    summary: {
      type: 'STRING',
      description: 'Executive briefing synthesizing sales, expenses, ads, and unit economics',
    },
    syntheticKpis: {
      type: 'ARRAY',
      description: '4-6 crucial calculated metrics with business commentary',
      items: {
        type: 'OBJECT',
        properties: {
          label: { type: 'STRING' },
          value: { type: 'STRING' },
          status: { type: 'STRING', enum: ['positive', 'warning', 'danger', 'neutral'] },
          commentary: { type: 'STRING' },
        },
        required: ['label', 'value', 'status', 'commentary'],
      },
    },
    strategicRoadmap: {
      type: 'OBJECT',
      properties: {
        immediateActions: {
          type: 'ARRAY',
          description: 'Immediate tactical actions to execute within 7 days',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              category: { type: 'STRING', enum: ['SALES', 'EXPENSES', 'ADS', 'OPS'] },
              impact: { type: 'STRING', enum: ['HIGH', 'MEDIUM'] },
              effort: { type: 'STRING', enum: ['LOW', 'MEDIUM', 'HIGH'] },
              detail: { type: 'STRING' },
            },
            required: ['title', 'category', 'impact', 'effort', 'detail'],
          },
        },
        tacticalMonthly: {
          type: 'ARRAY',
          description: 'Tactical business initiatives to roll out in the next 30 days',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              category: { type: 'STRING', enum: ['SALES', 'EXPENSES', 'ADS', 'OPS'] },
              impact: { type: 'STRING', enum: ['HIGH', 'MEDIUM'] },
              effort: { type: 'STRING', enum: ['LOW', 'MEDIUM', 'HIGH'] },
              detail: { type: 'STRING' },
            },
            required: ['title', 'category', 'impact', 'effort', 'detail'],
          },
        },
        quarterlyGrowth: {
          type: 'ARRAY',
          description: 'Strategic growth & structural plays for the next 60-90 days',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              category: { type: 'STRING', enum: ['SALES', 'EXPENSES', 'ADS', 'OPS'] },
              impact: { type: 'STRING', enum: ['HIGH', 'MEDIUM'] },
              effort: { type: 'STRING', enum: ['LOW', 'MEDIUM', 'HIGH'] },
              detail: { type: 'STRING' },
            },
            required: ['title', 'category', 'impact', 'effort', 'detail'],
          },
        },
      },
      required: ['immediateActions', 'tacticalMonthly', 'quarterlyGrowth'],
    },
    deepDives: {
      type: 'OBJECT',
      properties: {
        salesAndPricing: {
          type: 'OBJECT',
          properties: {
            strengths: { type: 'ARRAY', items: { type: 'STRING' } },
            risks: { type: 'ARRAY', items: { type: 'STRING' } },
            recommendations: { type: 'ARRAY', items: { type: 'STRING' } },
          },
          required: ['strengths', 'risks', 'recommendations'],
        },
        costOptimization: {
          type: 'OBJECT',
          properties: {
            wasteIdentified: { type: 'ARRAY', items: { type: 'STRING' } },
            savingsOpportunities: { type: 'ARRAY', items: { type: 'STRING' } },
            highestRiskExpense: { type: 'STRING' },
          },
          required: ['wasteIdentified', 'savingsOpportunities', 'highestRiskExpense'],
        },
        marketingAndAds: {
          type: 'OBJECT',
          properties: {
            roasEvaluation: { type: 'STRING' },
            budgetAdvice: { type: 'STRING' },
            scalingTactics: { type: 'ARRAY', items: { type: 'STRING' } },
          },
          required: ['roasEvaluation', 'budgetAdvice', 'scalingTactics'],
        },
        cashFlowAndCapital: {
          type: 'OBJECT',
          properties: {
            burnRateVerdict: { type: 'STRING' },
            partnerCapitalAdvice: { type: 'STRING' },
            runwayAssessment: { type: 'STRING' },
          },
          required: ['burnRateVerdict', 'partnerCapitalAdvice', 'runwayAssessment'],
        },
      },
      required: ['salesAndPricing', 'costOptimization', 'marketingAndAds', 'cashFlowAndCapital'],
    },
  },
  required: ['healthScore', 'healthStatus', 'summary', 'syntheticKpis', 'strategicRoadmap', 'deepDives'],
};

export function buildStrategicAnalysisPrompt(snapshot: FinancialSnapshot, focusArea: string = 'ALL'): string {
  return `
You are the elite Chief Financial Officer (CFO) and Chief Growth Strategist for "Blactify", an Indian direct-to-consumer (D2C) e-commerce brand operating on Shopify.
Your job is to rigorously diagnose the company's financial performance, uncover profit leaks, evaluate marketing efficiency, and provide an unambiguous, phased strategy ("Strategy to Follow") for executive decision-makers.

Currency: Indian Rupee (₹ / INR).
Analysis Timeframe: ${snapshot.timeframe.toUpperCase()} (${snapshot.dateRange.startDate} to ${snapshot.dateRange.endDate}, ${snapshot.dateRange.daysCount} days).
Special Focus Area: ${focusArea}

Here is the exact financial snapshot aggregated from the verified database ledger:

1. SALES & ORDER PERFORMANCE:
- Total Gross Sales / Revenue: ₹${snapshot.sales.totalRevenue.toLocaleString('en-IN')}
- Total Order Volume: ${snapshot.sales.totalOrders.toLocaleString('en-IN')} orders
- Average Order Value (AOV): ₹${snapshot.sales.aov.toLocaleString('en-IN')}
- Prepaid Orders: ${snapshot.sales.prepaidOrdersCount} orders (Revenue: ₹${snapshot.sales.prepaidRevenue.toLocaleString('en-IN')}, AOV: ₹${snapshot.sales.prepaidAov.toLocaleString('en-IN')})
- Cash on Delivery (COD) Orders: ${snapshot.sales.codOrdersCount} orders (Revenue: ₹${snapshot.sales.codRevenue.toLocaleString('en-IN')}, AOV: ₹${snapshot.sales.codAov.toLocaleString('en-IN')})
- COD Volume Share: ${snapshot.sales.codRatioPercent}%
- Fulfillment Rate: ${snapshot.sales.fulfillmentRatePercent}% (${snapshot.sales.fulfilledOrders} fulfilled vs ${snapshot.sales.unfulfilledOrders} unfulfilled)
- Recorded Refunds / Cancellations: ${snapshot.sales.refundedOrdersCount} orders
- Top 5 Products by Revenue:
${snapshot.sales.topProducts.slice(0, 5).map((p, i) => `  ${i + 1}. "${p.title}": ${p.unitsSold} units sold, ₹${p.revenue.toLocaleString('en-IN')}`).join('\n')}

2. OPERATIONAL & FIXED EXPENSES:
- Total Operational Expenses: ₹${snapshot.expenses.totalOperationalExpenses.toLocaleString('en-IN')}
- Categorized Expenses:
${snapshot.expenses.byCategory.map(c => `  • ${c.categoryName}: ₹${c.amount.toLocaleString('en-IN')} (${c.percentage}%)`).join('\n')}
- Largest Individual Expense Outlays:
${snapshot.expenses.topExpenseItems.map(e => `  • ₹${e.amount.toLocaleString('en-IN')} on "${e.title}" (${e.category}, ${e.date})`).join('\n')}

3. MARKETING & ADVERTISING (META ADS):
- Meta Ads Spend: ₹${snapshot.marketing.totalMetaAdsSpend.toLocaleString('en-IN')}
- Blended Return on Ad Spend (ROAS): ${snapshot.marketing.blendedRoas}x (Revenue / Ad Spend)
- Blended Customer Acquisition Cost (CAC): ₹${snapshot.marketing.blendedCac.toLocaleString('en-IN')} per order
- Marketing Efficiency Ratio (MER): ${snapshot.marketing.marketingEfficiencyRatioPercent}% of revenue

4. RECURRING MONTHLY OVERHEAD & FIXED BILLS:
- Current Month Expected Fixed Bills: ₹${snapshot.monthlyBills.totalExpectedOverhead.toLocaleString('en-IN')}
- Current Month Paid Fixed Bills: ₹${snapshot.monthlyBills.totalActualPaid.toLocaleString('en-IN')} (${snapshot.monthlyBills.paidCount} paid, ${snapshot.monthlyBills.pendingCount} pending)

5. PARTNER CAPITAL & CASH POSITION:
- Cumulative Partner Capital Injected: ₹${snapshot.capitalAndPartners.totalInvestments.toLocaleString('en-IN')}
- Cumulative Partner Distributions / Withdrawals: ₹${snapshot.capitalAndPartners.totalPayoutsAndWithdrawals.toLocaleString('en-IN')}

6. ESTIMATED NET PROFITABILITY & RUN-RATE:
- Net Operating Income (Sales - Ops Expenses - Meta Ads): ₹${snapshot.profitability.netOperatingIncome.toLocaleString('en-IN')}
- Net Profit Margin: ${snapshot.profitability.netMarginPercent}%
- Estimated Daily Net Cash Flow: ₹${snapshot.profitability.estimatedDailyBurnOrSurplus.toLocaleString('en-IN')}/day

CRITICAL GUIDELINES FOR YOUR EVALUATION:
1. Health Score (0-100):
   - Weigh net margin, COD exposure risk (COD in Indian e-commerce has high Return-To-Origin risk), ROAS efficiency, and cash flow stability.
2. The Strategic Roadmap ("Strategy to Follow") MUST be realistic, mathematically grounded, and hyper-actionable:
   - Immediate (7 Days): Quick wins, stop bleeding budget on low ROAS, renegotiate or pause non-essential tools.
   - Tactical (30 Days): Boost AOV through bundling the top products, introduce prepaid incentives to lower COD share, streamline fulfillment.
   - Strategic (60-90 Days): Scale winning SKU lines, renegotiate courier rates, optimize partner payout reinvestment ratio.
3. Be candid, analytical, and direct. Avoid generic corporate fluff. Always cite specific figures from the data.
`;
}

export function buildAdvisorChatPrompt(
  snapshot: FinancialSnapshot,
  latestReportSummary: string,
  userQuestion: string,
  conversationHistory: Array<{ role: 'user' | 'model'; content: string }>
): string {
  return `
You are the AI Business Growth Advisor for Blactify, an Indian D2C brand on Shopify.
You have access to the live store financials:
- Revenue: ₹${snapshot.sales.totalRevenue.toLocaleString('en-IN')}
- Total Orders: ${snapshot.sales.totalOrders} (AOV: ₹${snapshot.sales.aov.toLocaleString('en-IN')})
- COD Ratio: ${snapshot.sales.codRatioPercent}%
- Meta Ads Spend: ₹${snapshot.marketing.totalMetaAdsSpend.toLocaleString('en-IN')} (ROAS: ${snapshot.marketing.blendedRoas}x, CAC: ₹${snapshot.marketing.blendedCac.toLocaleString('en-IN')})
- Operating Expenses: ₹${snapshot.expenses.totalOperationalExpenses.toLocaleString('en-IN')}
- Net Operating Income: ₹${snapshot.profitability.netOperatingIncome.toLocaleString('en-IN')} (${snapshot.profitability.netMarginPercent}% margin)

Latest Strategic Diagnostic Summary:
"${latestReportSummary}"

Conversation History:
${conversationHistory.map(m => `${m.role === 'user' ? 'Founder' : 'AI Advisor'}: ${m.content}`).join('\n')}

The Founder is asking:
"${userQuestion}"

Provide a crisp, actionable, data-backed answer. Mention concrete numbers and practical steps for their Shopify store operations in India.
`;
}
