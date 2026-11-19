import React from 'react';
import { fmt } from '../utils.js';
import {
  TrendingUp,
  Percent,
  DollarSign,
  AlertOctagon,
  Tag,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function ProfitabilityPage({
  metrics,
  categoryData = [],
  productData = [],
  regionalData = [],
  onNavigate,
}) {
  const cogs = metrics?.cogs || (metrics?.revenue && metrics?.profit ? metrics.revenue - metrics.profit : 0);
  const discountLeakage = metrics?.discountAmount || 0;
  const grossSales = metrics?.grossSales || ((metrics?.revenue || 0) + discountLeakage);
  const discountLeakageRate = grossSales > 0 ? (discountLeakage / grossSales) * 100 : 0;

  // Identify high-revenue low-margin products
  const avgRev = productData.length > 0 ? (metrics?.revenue || 0) / productData.length : 0;
  const highRevLowMargin = productData.filter((p) => p.revenue > avgRev && p.margin < 18);
  const negativeProfit = productData.filter((p) => p.profit < 0);

  return (
    <div className="tf-page-content">
      {/* Top Level Financial Equation Ribbon */}
      <div className="tf-financial-ribbon">
        <div className="tf-fin-step">
          <span className="tf-fin-label">Gross Sales</span>
          <span className="tf-fin-val">{fmt.money(grossSales)}</span>
        </div>
        <div className="tf-fin-op">−</div>
        <div className="tf-fin-step">
          <span className="tf-fin-label">Discount Leakage</span>
          <span className="tf-fin-val tf-text-amber">{fmt.money(discountLeakage)}</span>
          <span className="tf-fin-sub">({discountLeakageRate.toFixed(1)}% of gross)</span>
        </div>
        <div className="tf-fin-op">=</div>
        <div className="tf-fin-step">
          <span className="tf-fin-label">Net Revenue</span>
          <span className="tf-fin-val tf-text-teal">{fmt.money(metrics?.revenue)}</span>
        </div>
        <div className="tf-fin-op">−</div>
        <div className="tf-fin-step">
          <span className="tf-fin-label">COGS (Product Costs)</span>
          <span className="tf-fin-val tf-text-muted">{fmt.money(cogs)}</span>
        </div>
        <div className="tf-fin-op">=</div>
        <div className="tf-fin-step tf-fin-highlight">
          <span className="tf-fin-label">Gross Profit</span>
          <span className="tf-fin-val tf-text-green">{fmt.money(metrics?.profit)}</span>
          <span className="tf-fin-sub">{metrics?.margin?.toFixed(1) || 0}% Net Margin</span>
        </div>
      </div>

      {/* Risk Callouts */}
      {(negativeProfit.length > 0 || highRevLowMargin.length > 0) && (
        <div className="tf-grid-2col" style={{ marginTop: '16px' }}>
          {negativeProfit.length > 0 && (
            <div className="tf-alert tf-alert-critical">
              <ShieldAlert size={18} />
              <div>
                <strong>Negative Profit Alert:</strong> {negativeProfit.length} product(s) (e.g.{' '}
                {negativeProfit.map((p) => p.product).join(', ')}) lose money on every unit sold.
                Recommended action: inspect pricing & supplier cost.
              </div>
            </div>
          )}

          {highRevLowMargin.length > 0 && (
            <div className="tf-alert tf-alert-warning">
              <AlertOctagon size={18} />
              <div>
                <strong>High Volume / Thin Margin Risk:</strong> {highRevLowMargin.length} high-grossing
                product(s) carry margins below 18%: {highRevLowMargin.map((p) => p.product).join(', ')}.
                Vulnerable to shipping or price shocks.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category-Wise Profitability Breakdown */}
      <div className="tf-panel" style={{ marginTop: '16px' }}>
        <div className="tf-panel-header">
          <div>
            <h3 className="tf-panel-title">Category Profitability Breakdown</h3>
            <p className="tf-panel-desc">Margin contribution and gross profit share by category</p>
          </div>
        </div>
        <div className="tf-panel-body" style={{ padding: 0 }}>
          <div className="tf-table-wrap">
            <table className="tf-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Units</th>
                  <th style={{ textAlign: 'right' }}>Net Revenue</th>
                  <th style={{ textAlign: 'right' }}>COGS</th>
                  <th style={{ textAlign: 'right' }}>Gross Profit</th>
                  <th style={{ textAlign: 'right' }}>Gross Margin</th>
                  <th style={{ minWidth: '160px' }}>Profit Contribution</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((c) => {
                  const catProfit = c.profit || 0;
                  const catRev = c.revenue || 0;
                  const catMargin = catRev > 0 ? (catProfit / catRev) * 100 : 0;
                  const profitShare =
                    metrics?.profit && metrics.profit > 0 ? (catProfit / metrics.profit) * 100 : 0;

                  return (
                    <tr key={c.name}>
                      <td className="tf-font-medium">{c.name}</td>
                      <td style={{ textAlign: 'right' }}>{fmt.num(c.units)}</td>
                      <td style={{ textAlign: 'right' }} className="tf-text-teal">
                        {fmt.money(catRev)}
                      </td>
                      <td style={{ textAlign: 'right' }} className="tf-text-muted">
                        {fmt.money(c.cogs || catRev - catProfit)}
                      </td>
                      <td style={{ textAlign: 'right' }} className="tf-text-green tf-font-medium">
                        {fmt.money(catProfit)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span
                          className={`tf-pill ${
                            catMargin < 15 ? 'tf-pill-warning' : 'tf-pill-positive'
                          }`}
                        >
                          {catMargin.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="tf-progress-track" style={{ flex: 1 }}>
                            <div
                              className="tf-progress-fill"
                              style={{ width: `${Math.max(0, Math.min(100, profitShare))}%` }}
                            />
                          </div>
                          <span style={{ fontSize: '11px', color: '#7a8ba0', width: '38px', textAlign: 'right' }}>
                            {profitShare.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Regional Profitability Table */}
      <div className="tf-panel" style={{ marginTop: '16px' }}>
        <div className="tf-panel-header">
          <div>
            <h3 className="tf-panel-title">Regional Margin Distribution</h3>
            <p className="tf-panel-desc">Comparing net revenue against gross profit across operating territories</p>
          </div>
          <button className="tf-btn-ghost tf-btn-sm" onClick={() => onNavigate('regional')}>
            Explore Territories
          </button>
        </div>
        <div className="tf-panel-body" style={{ padding: 0 }}>
          <div className="tf-table-wrap">
            <table className="tf-table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th style={{ textAlign: 'right' }}>Orders</th>
                  <th style={{ textAlign: 'right' }}>Net Revenue</th>
                  <th style={{ textAlign: 'right' }}>Gross Profit</th>
                  <th style={{ textAlign: 'right' }}>Margin %</th>
                  <th style={{ textAlign: 'right' }}>AOV</th>
                </tr>
              </thead>
              <tbody>
                {regionalData.map((r) => {
                  const rRev = r.revenue || 0;
                  const rProf = r.profit || 0;
                  const rMargin = rRev > 0 ? (rProf / rRev) * 100 : 0;
                  const rAov = r.orders > 0 ? rRev / r.orders : 0;

                  return (
                    <tr key={r.region}>
                      <td className="tf-font-medium">{r.region}</td>
                      <td style={{ textAlign: 'right' }}>{r.orders}</td>
                      <td style={{ textAlign: 'right' }} className="tf-text-teal">
                        {fmt.money(rRev)}
                      </td>
                      <td style={{ textAlign: 'right' }} className="tf-text-green tf-font-medium">
                        {fmt.money(rProf)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span
                          className={`tf-pill ${
                            rMargin < 15 ? 'tf-pill-warning' : 'tf-pill-positive'
                          }`}
                        >
                          {rMargin.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>{fmt.money(rAov)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
