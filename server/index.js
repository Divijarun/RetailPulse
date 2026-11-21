
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import importRoutes from './routes/importRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import decisionRoutes from './routes/decisionRoutes.js';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.get('/api/health', (_req, res) => {
  try {
    const tableCount = db.prepare(
      "SELECT count(*) AS c FROM sqlite_master WHERE type='table'"
    ).get();

    const companies = db.prepare(
      'SELECT COUNT(*) AS count FROM companies'
    ).get();

    const sales = db.prepare(
      'SELECT COUNT(*) AS count FROM sales'
    ).get();

    const batches = db.prepare(
      'SELECT COUNT(*) AS count FROM import_batches'
    ).get();

    res.json({
      status: 'healthy',
      database: 'connected',
      tableCount: tableCount.c,
      recordCounts: {
        companies: companies.count,
        sales: sales.count,
        import_batches: batches.count
      },
      ts: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      error: err.message
    });
  }
});

app.use('/api/import', importRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/decisions', decisionRoutes);

app.use((err, _req, res, _next) => {
  console.error('[TRADEFRAME API]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const isMain = process.argv[1] &&
  fileURLToPath(import.meta.url).toLowerCase() ===
  path.resolve(process.argv[1]).toLowerCase();

if (isMain || process.env.AUTO_START === 'true') {
  app.listen(PORT, () => {
    console.log(`TRADEFRAME API listening on port ${PORT}`);
  });
}

export default app;
