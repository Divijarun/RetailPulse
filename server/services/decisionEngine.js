import { db } from '../db.js';
import { getOverviewMetrics, getRevenueMonthly, getCategoryAnalytics, getProductAnalytics, getRegionalAnalytics } from './analytics.js';

/**
 * TRADEFRAME Business Decision Engine
 * Rule-based analysis — every finding is tied to real calculations.
 * Does NOT fabricate causes. Clearly distinguishes observations from recommendations.
 */
export function runDecisionEngine(companyId = 1, filters = {}) {
  const insights = [];

  try {
    const overview  = getOverviewMetrics(companyId, filters);
    const products  = getProductAnalytics(companyId, filters);
    const categories = getCategoryAnalytics(companyId, filters);
    const regions   = getRegionalAnalytics(companyId, filters);
    const monthly   = getRevenueMonthly(companyId, filters);

    if (!overview.orders) {
      return [{
        id: 'no-data',
        title: 'No data available',
        severity: 'info',
        what: 'No sales records match the current filters.',
        evidence: null,
        factors: 'Import sales data using Data Management, or clear active filters.',
        action: 'Navigate to Data Management → Import Sales Data.',
        tags: [],
      }];
    }

    // ── 1. Negative-margin products ───────────────────────────────
    const lossProducts = products.filter(p => p.profit < 0);
    if (lossProducts.length > 0) {
      const worst = lossProducts.sort((a, b) => a.profit - b.profit)[0];
      insights.push({
        id: 'loss-products',
        title: 'Loss-making products detected',
        severity: 'critical',
        what: `${lossProducts.length} product(s) are generating negative gross profit. They are costing more (COGS) than they earn in net revenue.`,
        evidence: `Worst: ${worst.product} (₹${worst.profit.toLocaleString('en-IN')} gross profit, ${worst.margin.toFixed(1)}% margin on ₹${worst.revenue.toLocaleString('en-IN')} revenue).`,
        factors: 'Possible contributors: unit cost exceeds unit price after discounting; deep discounts eroding revenue below cost.',
        action: 'Review unit cost and selling price for each loss-making product. Consider removing or repricing before the next ordering cycle.',
        tags: lossProducts.map(p => p.product),
      });
    }

    // ── 2. Low-margin products (margin < 15%) ─────────────────────
    const lowMarginProducts = products.filter(p => p.margin > 0 && p.margin < 15 && p.revenue > 0);
    if (lowMarginProducts.length > 0) {
      const names = lowMarginProducts.map(p => `${p.product} (${p.margin.toFixed(1)}%)`).join(', ');
      insights.push({
        id: 'low-margin-products',
        title: 'Low gross margin products',
        severity: 'warning',
        what: `${lowMarginProducts.length} product(s) have a gross margin below 15%, leaving minimal buffer for operating costs.`,
        evidence: `Affected products: ${names}.`,
        factors: 'Thin margins often result from competitive pricing pressure, high supplier costs, or excessive discounting.',
        action: 'Evaluate whether cost reduction, price adjustment, or reduced discount rates can improve margins. Compare with category averages.',
        tags: lowMarginProducts.map(p => p.product),
      });
    }

    // ── 3. Revenue concentration risk ────────────────────────────
    if (products.length >= 3) {
      const totalRev = overview.revenue;
      const sorted = [...products].sort((a, b) => b.revenue - a.revenue);
      const top1Rev = sorted[0]?.revenue || 0;
      const top1Pct = totalRev > 0 ? (top1Rev / totalRev) * 100 : 0;
      if (top1Pct > 40) {
        insights.push({
          id: 'revenue-concentration',
          title: 'Revenue concentration risk',
          severity: 'warning',
          what: `A single product — ${sorted[0].product} — accounts for ${top1Pct.toFixed(1)}% of total revenue.`,
          evidence: `${sorted[0].product}: ₹${top1Rev.toLocaleString('en-IN')} of ₹${totalRev.toLocaleString('en-IN')} total revenue.`,
          factors: 'High reliance on a single product creates business risk if demand falls, supply is disrupted, or competition intensifies.',
          action: 'Assess diversification opportunities. Consider growing the revenue contribution of secondary products.',
          tags: [sorted[0].product],
        });
      }
    }

    // ── 4. High discount leakage ──────────────────────────────────
    if (overview.avgDiscount > 8) {
      const discountRevLoss = overview.grossSales - overview.revenue;
      insights.push({
        id: 'high-discount',
        title: 'Elevated average discount rate',
        severity: overview.avgDiscount > 15 ? 'critical' : 'warning',
        what: `The average discount rate across all transactions is ${overview.avgDiscount.toFixed(1)}%, causing a revenue reduction of ₹${discountRevLoss.toLocaleString('en-IN')}.`,
        evidence: `Gross sales: ₹${overview.grossSales.toLocaleString('en-IN')}. Net revenue after discounts: ₹${overview.revenue.toLocaleString('en-IN')}. Discount leakage: ₹${discountRevLoss.toLocaleString('en-IN')}.`,
        factors: 'Discounting may be driven by sales targets, inventory clearance, or competitive pressure. Impact on margin depends on cost structure.',
        action: 'Review which products receive the highest discounts and whether those discounts are necessary to drive volume.',
        tags: [],
      });
    }

    // ── 5. Best-performing category ───────────────────────────────
    if (categories.length > 0) {
      const best = [...categories].sort((a, b) => b.profit - a.profit)[0];
      insights.push({
        id: 'top-category',
        title: `${best.name} is the leading profit contributor`,
        severity: 'positive',
        what: `${best.name} generates the highest gross profit among all categories, with a ${best.margin.toFixed(1)}% gross margin.`,
        evidence: `Revenue: ₹${best.revenue.toLocaleString('en-IN')}. Gross profit: ₹${best.profit.toLocaleString('en-IN')}. Gross margin: ${best.margin.toFixed(1)}%.`,
        factors: 'Strong margin may reflect lower supplier costs, less discounting, or premium pricing positioning in this category.',
        action: 'Consider allocating more resources to this category. Analyse what is driving margin strength and replicate it elsewhere.',
        tags: [best.name],
      });
    }

    // ── 6. Monthly revenue trend ─────────────────────────────────
    if (monthly.length >= 3) {
      const last3 = monthly.slice(-3);
      const revChange = ((last3[2].revenue - last3[0].revenue) / Math.abs(last3[0].revenue || 1)) * 100;
      if (revChange < -10) {
        insights.push({
          id: 'revenue-decline',
          title: 'Revenue declining over recent months',
          severity: 'critical',
          what: `Revenue declined by ${Math.abs(revChange).toFixed(1)}% between ${last3[0].key} and ${last3[2].key}.`,
          evidence: `${last3[0].key}: ₹${last3[0].revenue.toLocaleString('en-IN')} → ${last3[2].key}: ₹${last3[2].revenue.toLocaleString('en-IN')}.`,
          factors: 'Revenue decline can result from lower order volumes, reduced pricing, product mix changes, or seasonal patterns.',
          action: 'Investigate whether the decline is driven by fewer orders, smaller order sizes, or changes in product mix. Compare with same period last year if data is available.',
          tags: [],
        });
      } else if (revChange > 10) {
        insights.push({
          id: 'revenue-growth',
          title: 'Revenue growing steadily',
          severity: 'positive',
          what: `Revenue grew by ${revChange.toFixed(1)}% between ${last3[0].key} and ${last3[2].key}.`,
          evidence: `${last3[0].key}: ₹${last3[0].revenue.toLocaleString('en-IN')} → ${last3[2].key}: ₹${last3[2].revenue.toLocaleString('en-IN')}.`,
          factors: 'Growth may reflect increased demand, successful promotions, new product additions, or seasonal uplift.',
          action: 'Ensure supply chain and inventory can sustain this trajectory. Identify the primary drivers before scaling further.',
          tags: [],
        });
      }
    }

    // ── 7. Regional performance gap ──────────────────────────────
    if (regions.length >= 2) {
      const sorted = [...regions].sort((a, b) => b.margin - a.margin);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      const gap = best.margin - worst.margin;
      if (gap > 12) {
        insights.push({
          id: 'regional-gap',
          title: 'Significant regional profitability gap',
          severity: 'warning',
          what: `${best.region} achieves a ${best.margin.toFixed(1)}% gross margin while ${worst.region} achieves only ${worst.margin.toFixed(1)}% — a ${gap.toFixed(1)} percentage point gap.`,
          evidence: `${best.region}: margin ${best.margin.toFixed(1)}%, revenue ₹${best.revenue.toLocaleString('en-IN')}. ${worst.region}: margin ${worst.margin.toFixed(1)}%, revenue ₹${worst.revenue.toLocaleString('en-IN')}.`,
          factors: 'Regional margin differences may reflect different product mixes sold per region, local pricing strategies, or varying discount levels.',
          action: `Analyse what product categories are driving lower margins in ${worst.region}. Check if discounting is higher there than elsewhere.`,
          tags: [best.region, worst.region],
        });
      }
    }

    // ── 8. Overall margin health ──────────────────────────────────
    if (overview.margin > 0 && overview.margin < 20) {
      insights.push({
        id: 'overall-margin-thin',
        title: 'Overall gross margin is thin',
        severity: 'warning',
        what: `The overall gross margin is ${overview.margin.toFixed(1)}%, which leaves limited headroom for operating costs, overheads, and profit.`,
        evidence: `Total revenue: ₹${overview.revenue.toLocaleString('en-IN')}. Total gross profit: ₹${overview.profit.toLocaleString('en-IN')}. Margin: ${overview.margin.toFixed(1)}%.`,
        factors: 'Thin overall margins may result from discounting, product mix, or cost pressures across multiple categories.',
        action: 'Focus on improving margins in the weakest categories before attempting revenue growth. Reducing discount rates by 2–3% can improve margins meaningfully.',
        tags: [],
      });
    } else if (overview.margin >= 30) {
      insights.push({
        id: 'overall-margin-strong',
        title: 'Healthy overall gross margin',
        severity: 'positive',
        what: `The overall gross margin is ${overview.margin.toFixed(1)}%, indicating sound pricing relative to product costs.`,
        evidence: `Total revenue: ₹${overview.revenue.toLocaleString('en-IN')}. Total gross profit: ₹${overview.profit.toLocaleString('en-IN')}.`,
        factors: 'Strong margins may reflect effective cost management, premium product positioning, or controlled discounting.',
        action: 'Maintain cost discipline and avoid margin erosion through unnecessary discounting.',
        tags: [],
      });
    }

  } catch (err) {
    console.error('[Decision Engine] Error:', err.message);
    insights.push({
      id: 'engine-error',
      title: 'Decision engine encountered an error',
      severity: 'info',
      what: 'An internal error occurred while analysing the dataset.',
      evidence: err.message,
      factors: 'This is a system error, not a data error.',
      action: 'Check server logs and ensure the database is accessible.',
      tags: [],
    });
  }

  return insights;
}
