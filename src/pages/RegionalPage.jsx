import React, { useMemo } from 'react';
import { fmt } from '../utils.js';
import { RegionBarChart } from '../components/Charts.jsx';
import { MapPin, Globe, TrendingUp, DollarSign } from 'lucide-react';

export default function RegionalPage({ regionalData = [], salesRows = [] }) {
  const totalRevenue = useMemo(() => {
    return regionalData.reduce((s, r) => s + (Number(r.revenue) || 0), 0);
  }, [regionalData]);

  // Derive top product per region
  const topProductByRegion = useMemo(() => {
    const map = {};
    (salesRows || []).forEach((row) => {
      const reg = row.region || 'Unknown';
      if (!map[reg]) map[reg] = {};
      map[reg][row.product] = (map[reg][row.product] || 0) + (Number(row.revenue) || 0);
    });

    const result = {};
    Object.keys(map).forEach((reg) => {
      let topProd = '—';
      let maxRev = -1;
      Object.entries(map[reg]).forEach(([prod, rev]) => {
        if (rev > maxRev) {
          maxRev = rev;
          topProd = prod;
        }
      });
      result[reg] = { product: topProd, revenue: maxRev };
    });
    return result;
  }, [salesRows]);

  return (
    <div className="tf-page-content">
      {/* Visual Chart */}
      <div className="tf-panel">
        <div className="tf-panel-header">
          <div>
            <h3 className="tf-panel-title">Regional Revenue & Profit Breakdown</h3>
            <p className="tf-panel-desc">Comparison of volume, sales value, and margin by territory</p>
          </div>
        </div>
        <div className="tf-panel-body">
          <RegionBarChart data={regionalData} height={240} />
        </div>
      </div>

      {/* Regional Matrix Table */}
      <div className="tf-panel" style={{ marginTop: '16px' }}>
        <div className="tf-panel-header">
          <div>
            <h3 className="tf-panel-title">Territory Performance Matrix</h3>
            <p className="tf-panel-desc">Detailed metrics across all active regions</p>
          </div>
        </div>

        <div className="tf-panel-body" style={{ padding: 0 }}>
          <div className="tf-table-wrap">
            <table className="tf-table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th style={{ textAlign: 'right' }}>Orders</th>
                  <th style={{ textAlign: 'right' }}>Units Sold</th>
                  <th style={{ textAlign: 'right' }}>Net Revenue</th>
                  <th style={{ textAlign: 'right' }}>Share of Revenue</th>
                  <th style={{ textAlign: 'right' }}>Gross Profit</th>
                  <th style={{ textAlign: 'right' }}>Gross Margin</th>
                  <th>Top Product by Revenue</th>
                </tr>
              </thead>
              <tbody>
                {regionalData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="tf-table-empty">
                      No regional data available.
                    </td>
                  </tr>
                ) : (
                  regionalData.map((r) => {
                    const rRev = Number(r.revenue) || 0;
                    const rProfit = Number(r.profit) || 0;
                    const rMargin = rRev > 0 ? (rProfit / rRev) * 100 : 0;
                    const rShare = totalRevenue > 0 ? (rRev / totalRevenue) * 100 : 0;
                    const top = topProductByRegion[r.region];

                    return (
                      <tr key={r.region}>
                        <td className="tf-font-medium">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={13} className="tf-text-teal" />
                            {r.region}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>{fmt.num(r.orders)}</td>
                        <td style={{ textAlign: 'right' }}>{fmt.num(r.units)}</td>
                        <td style={{ textAlign: 'right' }} className="tf-text-teal tf-font-medium">
                          {fmt.money(rRev)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="tf-text-muted">{rShare.toFixed(1)}%</span>
                        </td>
                        <td
                          style={{ textAlign: 'right' }}
                          className={rProfit < 0 ? 'tf-text-red tf-font-medium' : 'tf-text-green tf-font-medium'}
                        >
                          {fmt.money(rProfit)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span
                            className={`tf-pill ${
                              rMargin < 15
                                ? 'tf-pill-warning'
                                : 'tf-pill-positive'
                            }`}
                          >
                            {rMargin.toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          {top?.product ? (
                            <span className="tf-font-medium" style={{ fontSize: '12px' }}>
                              {top.product} <span className="tf-text-muted">({fmt.compact(top.revenue)})</span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
