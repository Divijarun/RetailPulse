/**
 * TRADEFRAME — Shared formatting utilities
 */

export const fmt = {
  money: (v) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(v) || 0),

  compact: (v) => {
    const n = Number(v) || 0;
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
    if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
    if (n >= 1_000)      return `₹${(n / 1_000).toFixed(1)}k`;
    return `₹${Math.round(n)}`;
  },

  pct: (v, decimals = 1) => `${Number(v || 0).toFixed(decimals)}%`,

  num: (v) => Number(v || 0).toLocaleString('en-IN'),

  date: (v) => {
    if (!v) return '–';
    return new Date(`${v}T00:00:00`).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  },
};

/** Financial formulas — single source of truth */
export function calcFinancials({ units, unitPrice, unitCost, discountPct }) {
  const u   = Number(units) || 0;
  const p   = Number(unitPrice) || 0;
  const c   = Number(unitCost) || 0;
  const d   = Number(discountPct) || 0;

  const grossSales     = parseFloat((u * p).toFixed(2));
  const discountAmount = parseFloat(((grossSales * d) / 100).toFixed(2));
  const revenue        = parseFloat((grossSales - discountAmount).toFixed(2));
  const cogs           = parseFloat((u * c).toFixed(2));
  const grossProfit    = parseFloat((revenue - cogs).toFixed(2));
  const grossMargin    = revenue === 0 ? 0 : parseFloat(((grossProfit / revenue) * 100).toFixed(2));

  return { grossSales, discountAmount, revenue, cogs, grossProfit, grossMargin };
}

/** Normalise a demo row to the same shape as a live API row */
export function normaliseDemoRow(row) {
  const fin = calcFinancials({
    units: row.units,
    unitPrice: row.price,
    unitCost: row.cost,
    discountPct: row.discount,
  });
  return {
    order_id: row.id,
    order_date: row.date,
    product: row.product,
    category: row.category,
    region: row.region,
    units: row.units,
    unit_price: row.price,
    unit_cost: row.cost,
    discount_pct: row.discount,
    ...fin,
  };
}

/** Sort helper */
export function sortBy(arr, key, dir = 'desc') {
  return [...arr].sort((a, b) =>
    dir === 'desc' ? (b[key] || 0) - (a[key] || 0) : (a[key] || 0) - (b[key] || 0)
  );
}

/** Group rows by a key and aggregate revenue / profit / units */
export function groupAndAggregate(rows, keyFn, labelFn = null) {
  const map = new Map();
  rows.forEach(r => {
    const key = keyFn(r);
    if (!map.has(key)) {
      map.set(key, { name: labelFn ? labelFn(r) : key, revenue: 0, profit: 0, units: 0, orders: 0, cogs: 0, grossSales: 0 });
    }
    const e = map.get(key);
    e.revenue     += Number(r.revenue) || 0;
    e.profit      += Number(r.gross_profit) || Number(r.profit) || 0;
    e.units       += Number(r.units) || 0;
    e.orders      += 1;
    e.cogs        += Number(r.cogs) || 0;
    e.grossSales  += Number(r.gross_sales) || Number(r.grossSales) || 0;
  });
  return [...map.values()].map(e => ({
    ...e,
    margin: e.revenue ? parseFloat(((e.profit / e.revenue) * 100).toFixed(2)) : 0,
  }));
}

/** Build month label from YYYY-MM string */
export function monthLabel(ym) {
  if (!ym) return '';
  const [yr, mo] = ym.split('-').map(Number);
  return new Date(yr, mo - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

export const CHART_COLOURS = [
  '#7770ef', '#20a77d', '#3b82f6', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444',
];
