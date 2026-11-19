import express from 'express';
import { runDecisionEngine } from '../services/decisionEngine.js';

const router = express.Router();

/**
 * GET /api/decisions
 * Run the Business Decision Engine and return structured insights.
 */
router.get('/', (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId || '1', 10);
    const filters = {
      month:    req.query.month    || 'all',
      category: req.query.category || 'All categories',
      region:   req.query.region   || 'All regions',
      search:   req.query.search   || '',
    };

    const insights = runDecisionEngine(companyId, filters);
    return res.json({ success: true, data: insights, insights });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/decisions/simulate
 * What-if scenario simulation — all maths done server-side.
 * Body: { baseProductId, priceChangePct, discountPct, volumeChangePct, costChangePct, companyId }
 */
router.post('/simulate', (req, res) => {
  try {
    const {
      units         = 0,
      unitPrice     = 0,
      unitCost      = 0,
      discountPct   = 0,
      priceChangePct   = 0,   // % change to unit price
      discountChange   = 0,   // new absolute discount % override
      volumeChangePct  = 0,   // % change to units
      costChangePct    = 0,   // % change to unit cost
      useDiscountOverride = false,
    } = req.body;

    // Baseline
    const baseGross    = units * unitPrice;
    const baseDisc     = baseGross * discountPct / 100;
    const baseRevenue  = baseGross - baseDisc;
    const baseCOGS     = units * unitCost;
    const baseProfit   = baseRevenue - baseCOGS;
    const baseMargin   = baseRevenue > 0 ? (baseProfit / baseRevenue) * 100 : 0;

    // Scenario
    const simPrice    = unitPrice * (1 + priceChangePct / 100);
    const simCost     = unitCost  * (1 + costChangePct  / 100);
    const simUnits    = Math.round(units * (1 + volumeChangePct / 100));
    const simDiscount = useDiscountOverride ? discountChange : discountPct;

    const simGross    = simUnits * simPrice;
    const simDiscAmt  = simGross * simDiscount / 100;
    const simRevenue  = simGross - simDiscAmt;
    const simCOGS     = simUnits * simCost;
    const simProfit   = simRevenue - simCOGS;
    const simMargin   = simRevenue > 0 ? (simProfit / simRevenue) * 100 : 0;

    const r2 = v => Math.round(v * 100) / 100;

    return res.json({
      success: true,
      baseline: {
        units, unitPrice, unitCost, discountPct,
        grossSales: r2(baseGross),
        discountAmount: r2(baseDisc),
        revenue:  r2(baseRevenue),
        cogs:     r2(baseCOGS),
        profit:   r2(baseProfit),
        margin:   r2(baseMargin),
      },
      scenario: {
        units: simUnits, unitPrice: r2(simPrice), unitCost: r2(simCost), discountPct: simDiscount,
        grossSales: r2(simGross),
        discountAmount: r2(simDiscAmt),
        revenue:  r2(simRevenue),
        cogs:     r2(simCOGS),
        profit:   r2(simProfit),
        margin:   r2(simMargin),
      },
      delta: {
        revenue: r2(simRevenue  - baseRevenue),
        profit:  r2(simProfit   - baseProfit),
        margin:  r2(simMargin   - baseMargin),
        revenuePct: baseRevenue ? r2(((simRevenue - baseRevenue) / Math.abs(baseRevenue)) * 100) : 0,
        profitPct:  baseProfit  ? r2(((simProfit  - baseProfit)  / Math.abs(baseProfit))  * 100) : 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
