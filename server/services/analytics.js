import { db } from '../db.js';

function buildFilterClauses(companyId, filters = {}) {
  const params = [companyId];
  const conditions = ['company_id = ?'];

  if (filters.month && filters.month !== 'all') {
    conditions.push("strftime('%Y-%m', order_date) = ?");
    params.push(filters.month);
  }

  if (filters.category && filters.category !== 'All categories') {
    conditions.push('category = ?');
    params.push(filters.category);
  }

  if (filters.region && filters.region !== 'All regions') {
    conditions.push('region = ?');
    params.push(filters.region);
  }

  if (filters.search && filters.search.trim() !== '') {
    const q = `%${filters.search.trim().toLowerCase()}%`;
    conditions.push('(LOWER(order_id) LIKE ? OR LOWER(product) LIKE ? OR LOWER(category) LIKE ? OR LOWER(region) LIKE ?)');
    params.push(q, q, q, q);
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
}

export function getOverviewMetrics(companyId = 1, filters = {}) {
  const { whereClause, params } = buildFilterClauses(companyId, filters);

  const query = `
    SELECT
      COUNT(*) AS total_orders,
      COALESCE(SUM(units), 0) AS total_units,
      ROUND(COALESCE(SUM(gross_sales), 0), 2) AS total_gross_sales,
      ROUND(COALESCE(SUM(discount_amount), 0), 2) AS total_discount_amount,
      ROUND(COALESCE(SUM(revenue), 0), 2) AS total_revenue,
      ROUND(COALESCE(SUM(cogs), 0), 2) AS total_cogs,
      ROUND(COALESCE(SUM(gross_profit), 0), 2) AS total_gross_profit,
      ROUND(
        CASE 
          WHEN COALESCE(SUM(revenue), 0) = 0 THEN 0.0
          ELSE (100.0 * SUM(gross_profit)) / SUM(revenue)
        END,
        2
      ) AS overall_gross_margin_pct,
      ROUND(COALESCE(AVG(discount_pct), 0), 2) AS avg_discount_pct
    FROM sales
    ${whereClause}
  `;

  const row = db.prepare(query).get(...params);
  return {
    orders: row.total_orders,
    units: row.total_units,
    grossSales: row.total_gross_sales,
    discountAmount: row.total_discount_amount,
    revenue: row.total_revenue,
    cogs: row.total_cogs,
    profit: row.total_gross_profit,
    margin: row.overall_gross_margin_pct,
    avgDiscount: row.avg_discount_pct
  };
}

export function getRevenueMonthly(companyId = 1, filters = {}) {
  const { whereClause, params } = buildFilterClauses(companyId, filters);

  const query = `
    SELECT
      strftime('%Y-%m', order_date) AS sales_month,
      ROUND(SUM(gross_sales), 2) AS gross_sales,
      ROUND(SUM(revenue), 2) AS revenue,
      ROUND(SUM(cogs), 2) AS cogs,
      ROUND(SUM(gross_profit), 2) AS gross_profit,
      ROUND(
        CASE 
          WHEN SUM(revenue) = 0 THEN 0.0
          ELSE (100.0 * SUM(gross_profit)) / SUM(revenue)
        END,
        2
      ) AS gross_margin_pct,
      SUM(units) AS units_sold,
      COUNT(*) AS orders_count
    FROM sales
    ${whereClause}
    GROUP BY strftime('%Y-%m', order_date)
    ORDER BY sales_month ASC
  `;

  const rows = db.prepare(query).all(...params);
  return rows.map(r => ({
    key: r.sales_month,
    month: new Date(`${r.sales_month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short' }),
    grossSales: r.gross_sales,
    revenue: r.revenue,
    cogs: r.cogs,
    profit: r.gross_profit,
    margin: r.gross_margin_pct,
    units: r.units_sold,
    orders: r.orders_count
  }));
}

export function getCategoryAnalytics(companyId = 1, filters = {}) {
  const { whereClause, params } = buildFilterClauses(companyId, filters);

  const query = `
    SELECT
      category AS name,
      COUNT(*) AS order_count,
      SUM(units) AS units_sold,
      ROUND(SUM(gross_sales), 2) AS gross_sales,
      ROUND(SUM(revenue), 2) AS revenue,
      ROUND(SUM(gross_profit), 2) AS gross_profit,
      ROUND(
        CASE 
          WHEN SUM(revenue) = 0 THEN 0.0
          ELSE (100.0 * SUM(gross_profit)) / SUM(revenue)
        END,
        2
      ) AS gross_margin_pct
    FROM sales
    ${whereClause}
    GROUP BY category
    ORDER BY revenue DESC
  `;

  return db.prepare(query).all(...params).map(r => ({
    name: r.name,
    orderCount: r.order_count,
    units: r.units_sold,
    grossSales: r.gross_sales,
    revenue: r.revenue,
    profit: r.gross_profit,
    margin: r.gross_margin_pct
  }));
}

export function getProductAnalytics(companyId = 1, filters = {}) {
  const { whereClause, params } = buildFilterClauses(companyId, filters);

  const query = `
    SELECT
      product,
      category,
      SUM(units) AS units_sold,
      ROUND(SUM(gross_sales), 2) AS gross_sales,
      ROUND(SUM(revenue), 2) AS revenue,
      ROUND(SUM(cogs), 2) AS cogs,
      ROUND(SUM(gross_profit), 2) AS gross_profit,
      ROUND(
        CASE 
          WHEN SUM(revenue) = 0 THEN 0.0
          ELSE (100.0 * SUM(gross_profit)) / SUM(revenue)
        END,
        2
      ) AS gross_margin_pct
    FROM sales
    ${whereClause}
    GROUP BY product, category
    ORDER BY gross_profit DESC
  `;

  return db.prepare(query).all(...params).map(r => ({
    product: r.product,
    category: r.category,
    units: r.units_sold,
    grossSales: r.gross_sales,
    revenue: r.revenue,
    cogs: r.cogs,
    profit: r.gross_profit,
    margin: r.gross_margin_pct
  }));
}

export function getRegionalAnalytics(companyId = 1, filters = {}) {
  const { whereClause, params } = buildFilterClauses(companyId, filters);

  const query = `
    SELECT
      region,
      COUNT(*) AS order_count,
      SUM(units) AS units_sold,
      ROUND(SUM(gross_sales), 2) AS gross_sales,
      ROUND(SUM(revenue), 2) AS revenue,
      ROUND(SUM(gross_profit), 2) AS gross_profit,
      ROUND(
        CASE 
          WHEN SUM(revenue) = 0 THEN 0.0
          ELSE (100.0 * SUM(gross_profit)) / SUM(revenue)
        END,
        2
      ) AS gross_margin_pct
    FROM sales
    ${whereClause}
    GROUP BY region
    ORDER BY revenue DESC
  `;

  return db.prepare(query).all(...params).map(r => ({
    region: r.region,
    orderCount: r.order_count,
    units: r.units_sold,
    grossSales: r.gross_sales,
    revenue: r.revenue,
    profit: r.gross_profit,
    margin: r.gross_margin_pct
  }));
}

export function getDistinctFilterOptions(companyId = 1) {
  const categories = db.prepare(`
    SELECT DISTINCT category FROM sales WHERE company_id = ? ORDER BY category ASC
  `).all(companyId).map(r => r.category);

  const regions = db.prepare(`
    SELECT DISTINCT region FROM sales WHERE company_id = ? ORDER BY region ASC
  `).all(companyId).map(r => r.region);

  const months = db.prepare(`
    SELECT DISTINCT strftime('%Y-%m', order_date) AS month 
    FROM sales 
    WHERE company_id = ? 
    ORDER BY month ASC
  `).all(companyId).map(r => r.month);

  return { categories, regions, months };
}

export function generateBusinessInsights(companyId = 1, filters = {}) {
  const categories = getCategoryAnalytics(companyId, filters);
  const products = getProductAnalytics(companyId, filters);
  const overview = getOverviewMetrics(companyId, filters);

  if (!overview.orders) {
    return [{
      title: "No matching data",
      text: "Change or clear your filters or import new sales data to generate business insights.",
      type: "neutral",
    }];
  }

  const results = [];

  if (categories.length > 0) {
    const bestCategory = [...categories].sort((a, b) => b.profit - a.profit)[0];
    results.push({
      title: `${bestCategory.name} leads profit`,
      text: `This category generated ₹${bestCategory.profit.toLocaleString('en-IN')} in gross profit in the selected dataset.`,
      type: "positive",
    });

    const lowestMarginCategory = [...categories].sort((a, b) => a.margin - b.margin)[0];
    results.push({
      title: `${lowestMarginCategory.name}: review margins`,
      text: `Its gross margin is ${lowestMarginCategory.margin.toFixed(1)}%. Review costs, pricing, and discounts before changing prices.`,
      type: "warning",
    });
  }

  if (products.length > 0) {
    const bestProduct = products[0];
    results.push({
      title: `${bestProduct.product} leads product profit`,
      text: `It generated ₹${bestProduct.profit.toLocaleString('en-IN')} in gross profit across ${bestProduct.units} units sold.`,
      type: "positive",
    });
  }

  results.push({
    title: "Discount monitoring",
    text: `The average transaction-level discount rate is ${overview.avgDiscount.toFixed(1)}%. Compare discounted orders with full-price orders before changing promotions.`,
    type: "neutral",
  });

  return results;
}
