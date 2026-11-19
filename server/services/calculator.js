/**
 * RetailPulse Financial Calculation Engine
 * 
 * Formulas:
 * - Gross Sales = Units × Unit Price
 * - Discount Amount = Gross Sales × Discount Percentage / 100
 * - Net Revenue = Gross Sales − Discount Amount
 * - COGS (Cost of Goods Sold) = Units × Unit Cost
 * - Gross Profit = Net Revenue − COGS
 * - Gross Margin = (Gross Profit / Net Revenue) × 100
 */

export function calculateFinancials({ units, unitPrice, unitCost, discountPct }) {
  const parsedUnits = Number(units) || 0;
  const parsedPrice = Number(unitPrice) || 0;
  const parsedCost = Number(unitCost) || 0;
  const parsedDiscount = Number(discountPct) || 0;

  const grossSales = Number((parsedUnits * parsedPrice).toFixed(2));
  const discountAmount = Number(((grossSales * parsedDiscount) / 100).toFixed(2));
  const revenue = Number((grossSales - discountAmount).toFixed(2));
  const cogs = Number((parsedUnits * parsedCost).toFixed(2));
  const grossProfit = Number((revenue - cogs).toFixed(2));

  // Safe division for margin
  const grossMargin = revenue === 0 
    ? 0 
    : Number(((grossProfit / revenue) * 100).toFixed(2));

  return {
    grossSales,
    discountAmount,
    revenue,
    cogs,
    grossProfit,
    grossMargin
  };
}
