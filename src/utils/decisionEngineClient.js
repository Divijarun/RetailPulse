import { fmt, groupAndAggregate, sortBy } from '../utils.js';

/**
 * TRADEFRAME Client-side Decision Engine
 * Used for Demo mode or instant client evaluation.
 */
export function runClientDecisionEngine(rows = []) {
  if (!rows || rows.length === 0) {
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

  const insights = [];

  // 1. Overview calculations
  const totalRevenue = rows.reduce((s, r) => s + (Number(r.revenue) || 0), 0);
  const totalProfit = rows.reduce((s, r) => s + (Number(r.gross_profit) || Number(r.profit) || 0), 0);
  const totalGrossSales = rows.reduce((s, r) => s + (Number(r.gross_sales) || Number(r.grossSales) || 0), 0);
  const totalDiscount = rows.reduce((s, r) => s + (Number(r.discount_amount) || Number(r.discountAmount) || 0), 0);
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const discountLeakagePct = totalGrossSales > 0 ? (totalDiscount / totalGrossSales) * 100 : 0;

  // 2. Aggregate by product
  const products = groupAndAggregate(rows, r => r.product).map(p => ({
    product: p.name,
    revenue: p.revenue,
    profit: p.profit,
    units: p.units,
    margin: p.margin,
  }));

  // 3. Aggregate by category
  const categories = groupAndAggregate(rows, r => r.category).map(c => ({
    category: c.name,
    revenue: c.revenue,
    profit: c.profit,
    units: c.units,
    margin: c.margin,
  }));

  // 4. Aggregate by region
  const regions = groupAndAggregate(rows, r => r.region).map(reg => ({
    region: reg.name,
    revenue: reg.revenue,
    profit: reg.profit,
    units: reg.units,
    margin: reg.margin,
  }));

  // Rule 1: Loss-making products
  const lossProducts = products.filter(p => p.profit < 0);
  if (lossProducts.length > 0) {
    const worst = [...lossProducts].sort((a, b) => a.profit - b.profit)[0];
    insights.push({
      id: 'loss-products',
      title: 'Loss-making products detected',
      severity: 'critical',
      what: `${lossProducts.length} product(s) are generating negative gross profit. They are costing more (COGS) than they earn in net revenue.`,
      evidence: `Worst: ${worst.product} (${fmt.money(worst.profit)} gross profit, ${worst.margin.toFixed(1)}% margin on ${fmt.money(worst.revenue)} revenue).`,
      factors: 'Possible contributors: unit cost exceeds unit price after discounting; deep discounts eroding revenue below cost.',
      action: 'Review unit cost and selling price for each loss-making product. Consider removing or repricing before the next ordering cycle.',
      tags: lossProducts.map(p => p.product),
    });
  }

  // Rule 2: Low-margin products (<15%)
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

  // Rule 3: Revenue concentration risk
  if (products.length >= 3) {
    const sorted = [...products].sort((a, b) => b.revenue - a.revenue);
    const top1Rev = sorted[0]?.revenue || 0;
    const top1Pct = totalRevenue > 0 ? (top1Rev / totalRevenue) * 100 : 0;
    if (top1Pct > 40) {
      insights.push({
        id: 'revenue-concentration',
        title: 'Revenue concentration risk',
        severity: 'warning',
        what: `A single product — ${sorted[0].product} — accounts for ${top1Pct.toFixed(1)}% of total revenue.`,
        evidence: `${sorted[0].product}: ${fmt.money(top1Rev)} of ${fmt.money(totalRevenue)} total revenue.`,
        factors: 'High reliance on a single product creates business risk if demand falls, supply is disrupted, or competition intensifies.',
        action: 'Assess diversification opportunities. Consider growing the revenue contribution of secondary products.',
        tags: [sorted[0].product],
      });
    }
  }

  // Rule 4: High discount leakage (> 8%)
  if (discountLeakagePct > 8) {
    insights.push({
      id: 'discount-leakage',
      title: 'High discount leakage',
      severity: 'warning',
      what: `Discounts have consumed ${discountLeakagePct.toFixed(1)}% of gross sales value (${fmt.money(totalDiscount)} out of ${fmt.money(totalGrossSales)}).`,
      evidence: `Total discount amount: ${fmt.money(totalDiscount)}. Gross sales: ${fmt.money(totalGrossSales)}. Discount rate: ${discountLeakagePct.toFixed(1)}%.`,
      factors: 'Heavy discounting may indicate aggressive promotions, clearing excess inventory, or customer price resistance.',
      action: 'Run scenario analysis in What-if Simulator with lower discount rates to measure the impact on profit margin.',
      tags: ['Discounting', 'Margin Impact'],
    });
  }

  // Rule 5: Top category contribution
  if (categories.length > 0) {
    const topCat = [...categories].sort((a, b) => b.revenue - a.revenue)[0];
    const catPct = totalRevenue > 0 ? (topCat.revenue / totalRevenue) * 100 : 0;
    insights.push({
      id: 'top-category',
      title: `${topCat.category} leads revenue contribution`,
      severity: 'positive',
      what: `${topCat.category} is the top revenue generator, contributing ${catPct.toFixed(1)}% of total sales with a ${topCat.margin.toFixed(1)}% gross margin.`,
      evidence: `${topCat.category}: ${fmt.money(topCat.revenue)} revenue, ${fmt.money(topCat.profit)} profit across ${topCat.units} units.`,
      factors: 'Strong market demand, favorable pricing, or broader product catalog in this category.',
      action: 'Identify best practices in this category (pricing, supplier terms) and apply them to underperforming categories.',
      tags: [topCat.category],
    });
  }

  // Rule 6: Regional profitability gap
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
        evidence: `${best.region}: margin ${best.margin.toFixed(1)}%, revenue ${fmt.money(best.revenue)}. ${worst.region}: margin ${worst.margin.toFixed(1)}%, revenue ${fmt.money(worst.revenue)}.`,
        factors: 'Regional margin differences may reflect different product mixes sold per region, local pricing strategies, or varying discount levels.',
        action: `Analyse what product categories are driving lower margins in ${worst.region}. Check if discounting is higher there than elsewhere.`,
        tags: [best.region, worst.region],
      });
    }
  }

  // Rule 7: Overall margin health
  if (overallMargin > 0 && overallMargin < 20) {
    insights.push({
      id: 'overall-margin-thin',
      title: 'Overall gross margin is thin',
      severity: 'warning',
      what: `The overall gross margin is ${overallMargin.toFixed(1)}%, which leaves limited headroom for operating costs, overheads, and profit.`,
      evidence: `Total revenue: ${fmt.money(totalRevenue)}. Total gross profit: ${fmt.money(totalProfit)}. Margin: ${overallMargin.toFixed(1)}%.`,
      factors: 'Thin overall margins may result from discounting, product mix, or cost pressures across multiple categories.',
      action: 'Focus on improving margins in the weakest categories before attempting revenue growth. Reducing discount rates by 2–3% can improve margins meaningfully.',
      tags: ['Margin Health'],
    });
  } else if (overallMargin >= 30) {
    insights.push({
      id: 'overall-margin-strong',
      title: 'Healthy overall gross margin',
      severity: 'positive',
      what: `The overall gross margin is ${overallMargin.toFixed(1)}%, indicating sound pricing relative to product costs.`,
      evidence: `Total revenue: ${fmt.money(totalRevenue)}. Total gross profit: ${fmt.money(totalProfit)}. Margin: ${overallMargin.toFixed(1)}%.`,
      factors: 'Strong margins may reflect effective cost management, premium product positioning, or controlled discounting.',
      action: 'Maintain cost discipline and avoid margin erosion through unnecessary discounting.',
      tags: ['Profitability'],
    });
  }

  return insights;
}
