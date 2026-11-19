import express from 'express';
import {
  getOverviewMetrics,
  getRevenueMonthly,
  getCategoryAnalytics,
  getProductAnalytics,
  getRegionalAnalytics,
  getDistinctFilterOptions,
  generateBusinessInsights
} from '../services/analytics.js';

const router = express.Router();

function extractFilters(req) {
  const companyId = parseInt(req.query.companyId || '1', 10);
  const filters = {
    month: req.query.month || 'all',
    category: req.query.category || 'All categories',
    region: req.query.region || 'All regions',
    search: req.query.search || ''
  };
  return { companyId, filters };
}

/**
 * GET /api/analytics/overview
 * SQL aggregated business KPI overview
 */
router.get('/overview', (req, res) => {
  try {
    const { companyId, filters } = extractFilters(req);
    const overview = getOverviewMetrics(companyId, filters);
    return res.json({ success: true, data: overview });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/revenue
 * SQL monthly revenue, cogs, profit, and gross margin
 */
router.get('/revenue', (req, res) => {
  try {
    const { companyId, filters } = extractFilters(req);
    const revenueData = getRevenueMonthly(companyId, filters);
    return res.json({ success: true, data: revenueData });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/categories
 * SQL category performance breakdown
 */
router.get('/categories', (req, res) => {
  try {
    const { companyId, filters } = extractFilters(req);
    const categories = getCategoryAnalytics(companyId, filters);
    return res.json({ success: true, data: categories });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/products
 * SQL product profitability ranking
 */
router.get('/products', (req, res) => {
  try {
    const { companyId, filters } = extractFilters(req);
    const products = getProductAnalytics(companyId, filters);
    return res.json({ success: true, data: products });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/regions
 * SQL regional performance breakdown
 */
router.get('/regions', (req, res) => {
  try {
    const { companyId, filters } = extractFilters(req);
    const regions = getRegionalAnalytics(companyId, filters);
    return res.json({ success: true, data: regions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/filters
 * Distinct filter dropdown options from live database
 */
router.get('/filters', (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId || '1', 10);
    const options = getDistinctFilterOptions(companyId);
    return res.json({ success: true, data: options });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/insights
 * Recalculated business observations derived from SQL data
 */
router.get('/insights', (req, res) => {
  try {
    const { companyId, filters } = extractFilters(req);
    const insights = generateBusinessInsights(companyId, filters);
    return res.json({ success: true, data: insights });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
