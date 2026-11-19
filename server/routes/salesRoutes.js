import express from 'express';
import { db } from '../db.js';
import { calculateFinancials } from '../services/calculator.js';

const router = express.Router();

/**
 * GET /api/sales
 * List transactions with filtering, pagination, and sorting
 */
router.get('/', (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId || '1', 10);
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const offset = (page - 1) * limit;

    const conditions = ['company_id = ?'];
    const params = [companyId];

    if (req.query.month && req.query.month !== 'all') {
      conditions.push("strftime('%Y-%m', order_date) = ?");
      params.push(req.query.month);
    }

    if (req.query.category && req.query.category !== 'All categories') {
      conditions.push('category = ?');
      params.push(req.query.category);
    }

    if (req.query.region && req.query.region !== 'All regions') {
      conditions.push('region = ?');
      params.push(req.query.region);
    }

    if (req.query.search && req.query.search.trim() !== '') {
      const q = `%${req.query.search.trim().toLowerCase()}%`;
      conditions.push('(LOWER(order_id) LIKE ? OR LOWER(product) LIKE ? OR LOWER(category) LIKE ? OR LOWER(region) LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count for pagination
    const totalRow = db.prepare(`SELECT COUNT(*) AS total FROM sales ${whereClause}`).get(...params);
    const total = totalRow ? totalRow.total : 0;

    // Fetch records
    const query = `
      SELECT 
        id, order_id, company_id, order_date, product, category, region,
        units, unit_price, unit_cost, discount_pct, gross_sales, discount_amount,
        revenue, cogs, gross_profit, gross_margin, import_batch_id, created_at
      FROM sales
      ${whereClause}
      ORDER BY order_date DESC, id DESC
      LIMIT ? OFFSET ?
    `;

    const records = db.prepare(query).all(...params, limit, offset);

    return res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: records
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/companies
 * Return companies list
 */
router.get('/companies', (req, res) => {
  try {
    const companies = db.prepare('SELECT id, name, code, currency, created_at FROM companies ORDER BY id ASC').all();
    return res.json({ success: true, companies });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/sales/reset
 * Resets sales records and batches for specified company
 */
router.delete('/reset', (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId || '1', 10);
    const deleteTx = db.transaction(() => {
      db.prepare('DELETE FROM sales WHERE company_id = ?').run(companyId);
      db.prepare('DELETE FROM import_batches WHERE company_id = ?').run(companyId);
    });
    deleteTx();
    return res.json({ success: true, message: `All sales data reset for company ${companyId}.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/sales/seed-sample
 * Seeds standard sample dataset into company database
 */
router.post('/seed-sample', (req, res) => {
  try {
    const companyId = parseInt(req.body.companyId || '1', 10);
    const sampleData = [
      { id: "ORD-1001", date: "2026-01-05", product: "Wireless Mouse", category: "Electronics", region: "North", units: 18, price: 899, cost: 480, discount: 5 },
      { id: "ORD-1002", date: "2026-01-09", product: "Office Chair", category: "Furniture", region: "West", units: 4, price: 6499, cost: 4300, discount: 10 },
      { id: "ORD-1003", date: "2026-01-14", product: "Notebook Set", category: "Stationery", region: "South", units: 32, price: 299, cost: 155, discount: 0 },
      { id: "ORD-1004", date: "2026-01-21", product: "Bluetooth Speaker", category: "Electronics", region: "East", units: 9, price: 2499, cost: 1600, discount: 8 },
      { id: "ORD-1005", date: "2026-02-03", product: "Desk Lamp", category: "Furniture", region: "North", units: 13, price: 1299, cost: 700, discount: 5 },
      { id: "ORD-1006", date: "2026-02-08", product: "Premium Pens", category: "Stationery", region: "West", units: 26, price: 199, cost: 85, discount: 0 },
      { id: "ORD-1007", date: "2026-02-15", product: "Mechanical Keyboard", category: "Electronics", region: "South", units: 7, price: 3499, cost: 2200, discount: 12 },
      { id: "ORD-1008", date: "2026-02-24", product: "Bookshelf", category: "Furniture", region: "East", units: 3, price: 7999, cost: 5600, discount: 8 },
      { id: "ORD-1009", date: "2026-03-04", product: "Wireless Mouse", category: "Electronics", region: "West", units: 24, price: 899, cost: 480, discount: 0 },
      { id: "ORD-1010", date: "2026-03-10", product: "Notebook Set", category: "Stationery", region: "North", units: 41, price: 299, cost: 155, discount: 5 },
      { id: "ORD-1011", date: "2026-03-17", product: "Office Chair", category: "Furniture", region: "South", units: 6, price: 6499, cost: 4300, discount: 15 },
      { id: "ORD-1012", date: "2026-03-26", product: "Bluetooth Speaker", category: "Electronics", region: "East", units: 12, price: 2499, cost: 1600, discount: 5 },
      { id: "ORD-1013", date: "2026-04-02", product: "Premium Pens", category: "Stationery", region: "North", units: 35, price: 199, cost: 85, discount: 0 },
      { id: "ORD-1014", date: "2026-04-11", product: "Desk Lamp", category: "Furniture", region: "West", units: 17, price: 1299, cost: 700, discount: 10 },
      { id: "ORD-1015", date: "2026-04-16", product: "Mechanical Keyboard", category: "Electronics", region: "South", units: 11, price: 3499, cost: 2200, discount: 5 },
      { id: "ORD-1016", date: "2026-04-27", product: "Notebook Set", category: "Stationery", region: "East", units: 48, price: 299, cost: 155, discount: 0 },
      { id: "ORD-1017", date: "2026-05-05", product: "Bookshelf", category: "Furniture", region: "North", units: 5, price: 7999, cost: 5600, discount: 12 },
      { id: "ORD-1018", date: "2026-05-12", product: "Wireless Mouse", category: "Electronics", region: "South", units: 29, price: 899, cost: 480, discount: 8 },
      { id: "ORD-1019", date: "2026-05-19", product: "Premium Pens", category: "Stationery", region: "West", units: 44, price: 199, cost: 85, discount: 5 },
      { id: "ORD-1020", date: "2026-05-28", product: "Office Chair", category: "Furniture", region: "East", units: 7, price: 6499, cost: 4300, discount: 5 },
      { id: "ORD-1021", date: "2026-06-03", product: "Bluetooth Speaker", category: "Electronics", region: "North", units: 15, price: 2499, cost: 1600, discount: 0 },
      { id: "ORD-1022", date: "2026-06-09", product: "Notebook Set", category: "Stationery", region: "South", units: 53, price: 299, cost: 155, discount: 5 },
      { id: "ORD-1023", date: "2026-06-18", product: "Desk Lamp", category: "Furniture", region: "East", units: 21, price: 1299, cost: 700, discount: 5 },
      { id: "ORD-1024", date: "2026-06-25", product: "Mechanical Keyboard", category: "Electronics", region: "West", units: 14, price: 3499, cost: 2200, discount: 10 },
    ];

    const seedTx = db.transaction(() => {
      const batch = db.prepare(`
        INSERT INTO import_batches (
          company_id, file_name, file_size, total_records, valid_records, invalid_records, status
        ) VALUES (?, 'sample_seed_data.csv', 2048, ?, ?, 0, 'completed')
      `).run(companyId, sampleData.length, sampleData.length);

      const batchId = batch.lastInsertRowid;

      const stmt = db.prepare(`
        INSERT INTO sales (
          order_id, company_id, order_date, product, category, region,
          units, unit_price, unit_cost, discount_pct, gross_sales, discount_amount,
          revenue, cogs, gross_profit, gross_margin, import_batch_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(company_id, order_id) DO UPDATE SET
          order_date = excluded.order_date,
          product = excluded.product,
          category = excluded.category,
          region = excluded.region,
          units = excluded.units,
          unit_price = excluded.unit_price,
          unit_cost = excluded.unit_cost,
          discount_pct = excluded.discount_pct,
          gross_sales = excluded.gross_sales,
          discount_amount = excluded.discount_amount,
          revenue = excluded.revenue,
          cogs = excluded.cogs,
          gross_profit = excluded.gross_profit,
          gross_margin = excluded.gross_margin,
          import_batch_id = excluded.import_batch_id
      `);

      for (const item of sampleData) {
        const fin = calculateFinancials({
          units: item.units,
          unitPrice: item.price,
          unitCost: item.cost,
          discountPct: item.discount
        });

        stmt.run(
          item.id,
          companyId,
          item.date,
          item.product,
          item.category,
          item.region,
          item.units,
          item.price,
          item.cost,
          item.discount,
          fin.grossSales,
          fin.discountAmount,
          fin.revenue,
          fin.cogs,
          fin.grossProfit,
          fin.grossMargin,
          batchId
        );
      }
    });

    seedTx();
    return res.json({ success: true, message: `Successfully seeded ${sampleData.length} records.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
