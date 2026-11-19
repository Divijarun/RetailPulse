import React, { useState, useMemo } from 'react';
import { fmt, calcFinancials } from '../utils.js';
import { Sliders, RotateCcw, AlertCircle, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

export default function WhatIfPage({ productData = [], salesRows = [] }) {
  // Aggregate products to know baseline units, avg price, avg cost, avg discount
  const catalogBaselines = useMemo(() => {
    const map = {};
    (salesRows || []).forEach((row) => {
      const prod = row.product;
      if (!map[prod]) {
        map[prod] = {
          product: prod,
          units: 0,
          grossSales: 0,
          discountAmount: 0,
          cogs: 0,
          revenue: 0,
          profit: 0,
        };
      }
      const u = Number(row.units) || 0;
      const p = Number(row.unit_price) || Number(row.price) || 0;
      const c = Number(row.unit_cost) || Number(row.cost) || 0;
      const disc = Number(row.discount_pct !== undefined ? row.discount_pct : row.discount) || 0;
      const gs = u * p;
      const da = (gs * disc) / 100;
      const rev = gs - da;
      const cg = u * c;
      const prof = rev - cg;

      map[prod].units += u;
      map[prod].grossSales += gs;
      map[prod].discountAmount += da;
      map[prod].cogs += cg;
      map[prod].revenue += rev;
      map[prod].profit += prof;
    });

    const list = Object.values(map).map((p) => {
      const unitPrice = p.units > 0 ? p.grossSales / p.units : 0;
      const unitCost = p.units > 0 ? p.cogs / p.units : 0;
      const discountPct = p.grossSales > 0 ? (p.discountAmount / p.grossSales) * 100 : 0;
      return {
        product: p.product,
        units: p.units,
        unitPrice: Math.round(unitPrice),
        unitCost: Math.round(unitCost),
        discountPct: parseFloat(discountPct.toFixed(1)),
        revenue: Math.round(p.revenue),
        profit: Math.round(p.profit),
        margin: p.revenue > 0 ? parseFloat(((p.profit / p.revenue) * 100).toFixed(1)) : 0,
      };
    });
    return list.sort((a, b) => b.revenue - a.revenue);
  }, [salesRows]);

  const defaultProduct = catalogBaselines[0]?.product || '';
  const [selectedProduct, setSelectedProduct] = useState(defaultProduct);

  // Slider adjustments
  const [priceChangePct, setPriceChangePct] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);
  const [volumeChangePct, setVolumeChangePct] = useState(0);
  const [costChangePct, setCostChangePct] = useState(0);
  const [customDiscountActive, setCustomDiscountActive] = useState(false);

  // Baseline data for chosen product
  const currentBaseline = useMemo(() => {
    const found = catalogBaselines.find((p) => p.product === selectedProduct);
    if (!found) {
      return {
        product: 'Custom Baseline',
        units: 100,
        unitPrice: 1000,
        unitCost: 600,
        discountPct: 5,
        ...calcFinancials({ units: 100, unitPrice: 1000, unitCost: 600, discountPct: 5 }),
      };
    }
    const fin = calcFinancials({
      units: found.units,
      unitPrice: found.unitPrice,
      unitCost: found.unitCost,
      discountPct: found.discountPct,
    });
    return { ...found, ...fin };
  }, [catalogBaselines, selectedProduct]);

  // When changing product, reset sliders
  const handleProductChange = (prod) => {
    setSelectedProduct(prod);
    setPriceChangePct(0);
    setVolumeChangePct(0);
    setCostChangePct(0);
    const found = catalogBaselines.find((p) => p.product === prod);
    setDiscountPct(found ? found.discountPct : 5);
    setCustomDiscountActive(false);
  };

  const handleResetSliders = () => {
    setPriceChangePct(0);
    setVolumeChangePct(0);
    setCostChangePct(0);
    setDiscountPct(currentBaseline.discountPct);
    setCustomDiscountActive(false);
  };

  // Simulated financials
  const simulated = useMemo(() => {
    const baseU = currentBaseline.units;
    const baseP = currentBaseline.unitPrice;
    const baseC = currentBaseline.unitCost;
    const effDisc = customDiscountActive ? discountPct : currentBaseline.discountPct;

    const simUnits = Math.max(0, Math.round(baseU * (1 + volumeChangePct / 100)));
    const simPrice = Math.max(0, baseP * (1 + priceChangePct / 100));
    const simCost = Math.max(0, baseC * (1 + costChangePct / 100));

    const fin = calcFinancials({
      units: simUnits,
      unitPrice: simPrice,
      unitCost: simCost,
      discountPct: effDisc,
    });

    return {
      units: simUnits,
      unitPrice: simPrice,
      unitCost: simCost,
      discountPct: effDisc,
      ...fin,
    };
  }, [currentBaseline, priceChangePct, discountPct, volumeChangePct, costChangePct, customDiscountActive]);

  // Delta calculations
  const revDelta = simulated.revenue - currentBaseline.revenue;
  const revDeltaPct = currentBaseline.revenue > 0 ? (revDelta / currentBaseline.revenue) * 100 : 0;
  const profitDelta = simulated.grossProfit - currentBaseline.grossProfit;
  const profitDeltaPct =
    currentBaseline.grossProfit !== 0 ? (profitDelta / Math.abs(currentBaseline.grossProfit)) * 100 : 0;
  const marginDelta = simulated.grossMargin - currentBaseline.grossMargin;

  return (
    <div className="tf-page-content">
      {/* Disclaimer Banner */}
      <div className="tf-sim-banner">
        <AlertCircle size={16} />
        <div>
          <strong>Scenario Modeling Environment:</strong> Values shown are hypothetical forecasts calculated from
          your mathematical parameter adjustments. Changes do NOT alter actual database records.
        </div>
      </div>

      {/* Target Selector */}
      <div className="tf-panel" style={{ marginTop: '16px' }}>
        <div className="tf-panel-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>Select Item to Model:</label>
            <select
              className="tf-select"
              style={{ minWidth: '240px' }}
              value={selectedProduct}
              onChange={(e) => handleProductChange(e.target.value)}
            >
              {catalogBaselines.map((p) => (
                <option key={p.product} value={p.product}>
                  {p.product} ({fmt.num(p.units)} sold | {fmt.money(p.revenue)})
                </option>
              ))}
            </select>
          </div>
          <button className="tf-btn-ghost tf-btn-sm" onClick={handleResetSliders}>
            <RotateCcw size={13} /> Reset Controls
          </button>
        </div>
      </div>

      {/* 2-Column: Sliders on Left, Simulation Cards on Right */}
      <div className="tf-grid-2col" style={{ marginTop: '16px' }}>
        {/* Sliders Card */}
        <div className="tf-panel">
          <div className="tf-panel-header">
            <div>
              <h3 className="tf-panel-title">Decision Levers</h3>
              <p className="tf-panel-desc">Adjust pricing, cost, discount and demand levers</p>
            </div>
          </div>
          <div className="tf-panel-body">
            {/* Slider 1: Price Change */}
            <div className="tf-slider-group">
              <div className="tf-slider-header">
                <span className="tf-slider-title">Selling Price Adjustment</span>
                <span className={`tf-slider-val ${priceChangePct > 0 ? 'tf-text-green' : priceChangePct < 0 ? 'tf-text-red' : ''}`}>
                  {priceChangePct > 0 ? `+${priceChangePct}%` : `${priceChangePct}%`}
                  <span className="tf-text-muted" style={{ fontSize: '11px', marginLeft: 6 }}>
                    ({fmt.money(simulated.unitPrice)} / unit)
                  </span>
                </span>
              </div>
              <input
                type="range"
                className="tf-slider"
                min="-50"
                max="50"
                step="1"
                value={priceChangePct}
                onChange={(e) => setPriceChangePct(Number(e.target.value))}
              />
              <div className="tf-slider-scale">
                <span>-50%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>

            {/* Slider 2: Discount Rate */}
            <div className="tf-slider-group" style={{ marginTop: '20px' }}>
              <div className="tf-slider-header">
                <span className="tf-slider-title">Discount Rate Policy</span>
                <span className="tf-slider-val tf-text-amber">
                  {(customDiscountActive ? discountPct : currentBaseline.discountPct).toFixed(1)}%
                  <span className="tf-text-muted" style={{ fontSize: '11px', marginLeft: 6 }}>
                    (Baseline: {currentBaseline.discountPct.toFixed(1)}%)
                  </span>
                </span>
              </div>
              <input
                type="range"
                className="tf-slider"
                min="0"
                max="50"
                step="0.5"
                value={customDiscountActive ? discountPct : currentBaseline.discountPct}
                onChange={(e) => {
                  setCustomDiscountActive(true);
                  setDiscountPct(Number(e.target.value));
                }}
              />
              <div className="tf-slider-scale">
                <span>0% (No discount)</span>
                <span>25%</span>
                <span>50% (Heavy promotion)</span>
              </div>
            </div>

            {/* Slider 3: Volume Change */}
            <div className="tf-slider-group" style={{ marginTop: '20px' }}>
              <div className="tf-slider-header">
                <span className="tf-slider-title">Projected Unit Volume</span>
                <span className={`tf-slider-val ${volumeChangePct > 0 ? 'tf-text-teal' : volumeChangePct < 0 ? 'tf-text-red' : ''}`}>
                  {volumeChangePct > 0 ? `+${volumeChangePct}%` : `${volumeChangePct}%`}
                  <span className="tf-text-muted" style={{ fontSize: '11px', marginLeft: 6 }}>
                    ({simulated.units} units)
                  </span>
                </span>
              </div>
              <input
                type="range"
                className="tf-slider"
                min="-50"
                max="100"
                step="5"
                value={volumeChangePct}
                onChange={(e) => setVolumeChangePct(Number(e.target.value))}
              />
              <div className="tf-slider-scale">
                <span>-50% (Contraction)</span>
                <span>Baseline</span>
                <span>+100% (Double)</span>
              </div>
            </div>

            {/* Slider 4: Cost Change */}
            <div className="tf-slider-group" style={{ marginTop: '20px' }}>
              <div className="tf-slider-header">
                <span className="tf-slider-title">Supplier / Unit Cost Shift</span>
                <span className={`tf-slider-val ${costChangePct > 0 ? 'tf-text-red' : costChangePct < 0 ? 'tf-text-green' : ''}`}>
                  {costChangePct > 0 ? `+${costChangePct}%` : `${costChangePct}%`}
                  <span className="tf-text-muted" style={{ fontSize: '11px', marginLeft: 6 }}>
                    ({fmt.money(simulated.unitCost)} / unit)
                  </span>
                </span>
              </div>
              <input
                type="range"
                className="tf-slider"
                min="-30"
                max="30"
                step="1"
                value={costChangePct}
                onChange={(e) => setCostChangePct(Number(e.target.value))}
              />
              <div className="tf-slider-scale">
                <span>-30% (Negotiated saving)</span>
                <span>0%</span>
                <span>+30% (Inflation / Tariff)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="tf-panel">
          <div className="tf-panel-header">
            <div>
              <h3 className="tf-panel-title">Forecasted Financial Impact</h3>
              <p className="tf-panel-desc">Side-by-side comparison with current baseline</p>
            </div>
          </div>
          <div className="tf-panel-body">
            <div className="tf-sim-cards">
              {/* Baseline column */}
              <div className="tf-sim-col">
                <div className="tf-sim-col-header">Actual Baseline</div>
                <div className="tf-sim-metric">
                  <span className="tf-sim-label">Net Revenue</span>
                  <span className="tf-sim-num">{fmt.money(currentBaseline.revenue)}</span>
                </div>
                <div className="tf-sim-metric">
                  <span className="tf-sim-label">Gross Profit</span>
                  <span className="tf-sim-num">{fmt.money(currentBaseline.grossProfit)}</span>
                </div>
                <div className="tf-sim-metric">
                  <span className="tf-sim-label">Gross Margin</span>
                  <span className="tf-sim-num">{currentBaseline.grossMargin.toFixed(1)}%</span>
                </div>
                <div className="tf-sim-metric">
                  <span className="tf-sim-label">COGS Total</span>
                  <span className="tf-sim-num">{fmt.money(currentBaseline.cogs)}</span>
                </div>
                <div className="tf-sim-metric">
                  <span className="tf-sim-label">Units Sold</span>
                  <span className="tf-sim-num">{fmt.num(currentBaseline.units)}</span>
                </div>
              </div>

              {/* Scenario column */}
              <div className="tf-sim-col tf-sim-scenario">
                <div className="tf-sim-col-header tf-text-teal">Model Scenario</div>
                <div className="tf-sim-metric">
                  <span className="tf-sim-label">Net Revenue</span>
                  <span className="tf-sim-num tf-text-teal">{fmt.money(simulated.revenue)}</span>
                </div>
                <div className="tf-sim-metric">
                  <span className="tf-sim-label">Gross Profit</span>
                  <span className={`tf-sim-num ${simulated.grossProfit >= 0 ? 'tf-text-green' : 'tf-text-red'}`}>
                    {fmt.money(simulated.grossProfit)}
                  </span>
                </div>
                <div className="tf-sim-metric">
                  <span className="tf-sim-label">Gross Margin</span>
                  <span className="tf-sim-num">{simulated.grossMargin.toFixed(1)}%</span>
                </div>
                <div className="tf-sim-metric">
                  <span className="tf-sim-label">COGS Total</span>
                  <span className="tf-sim-num">{fmt.money(simulated.cogs)}</span>
                </div>
                <div className="tf-sim-metric">
                  <span className="tf-sim-label">Units Sold</span>
                  <span className="tf-sim-num">{fmt.num(simulated.units)}</span>
                </div>
              </div>
            </div>

            {/* Net Variance Summary */}
            <div className="tf-sim-variance" style={{ marginTop: '20px' }}>
              <div className="tf-variance-header">Net Variance vs Baseline</div>
              <div className="tf-variance-grid">
                <div className="tf-variance-item">
                  <span className="tf-var-label">Revenue Delta</span>
                  <span className={`tf-var-val ${revDelta >= 0 ? 'tf-text-green' : 'tf-text-red'}`}>
                    {revDelta >= 0 ? `+${fmt.money(revDelta)}` : fmt.money(revDelta)}
                    <span style={{ fontSize: '11px', display: 'block' }}>
                      ({revDeltaPct >= 0 ? `+${revDeltaPct.toFixed(1)}%` : `${revDeltaPct.toFixed(1)}%`})
                    </span>
                  </span>
                </div>

                <div className="tf-variance-item">
                  <span className="tf-var-label">Profit Delta</span>
                  <span className={`tf-var-val ${profitDelta >= 0 ? 'tf-text-green' : 'tf-text-red'}`}>
                    {profitDelta >= 0 ? `+${fmt.money(profitDelta)}` : fmt.money(profitDelta)}
                    <span style={{ fontSize: '11px', display: 'block' }}>
                      ({profitDeltaPct >= 0 ? `+${profitDeltaPct.toFixed(1)}%` : `${profitDeltaPct.toFixed(1)}%`})
                    </span>
                  </span>
                </div>

                <div className="tf-variance-item">
                  <span className="tf-var-label">Margin Shift</span>
                  <span className={`tf-var-val ${marginDelta >= 0 ? 'tf-text-green' : 'tf-text-red'}`}>
                    {marginDelta >= 0 ? `+${marginDelta.toFixed(1)}%` : `${marginDelta.toFixed(1)}%`}
                    <span style={{ fontSize: '11px', display: 'block' }}>percentage pts</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
