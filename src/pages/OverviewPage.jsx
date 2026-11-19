import React from 'react';
import { fmt } from '../utils.js';
import { RevenueTrendChart, CategoryDonutChart } from '../components/Charts.jsx';
import {
  TrendingUp,
  DollarSign,
  Percent,
  ShoppingCart,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  PackageCheck
} from 'lucide-react';

export default function OverviewPage({
  metrics,
  monthlyData,
  categoryData,
  productData,
  salesRows,
  onNavigate,
}) {
  const topProducts = (productData || []).slice(0, 5);
  const recentOrders = (salesRows || []).slice(0, 8);

  const kpis = [
    {
      label: 'Total Net Revenue',
      value: fmt.money(metrics?.revenue),
      sub: `${metrics?.orders || 0} orders recorded`,
      icon: DollarSign,
      color: 'teal',
    },
    {
      label: 'Gross Profit',
      value: fmt.money(metrics?.profit),
      sub: `${metrics?.margin?.toFixed(1) || 0}% overall margin`,
      icon: TrendingUp,
      color: 'green',
    },
    {
      label: 'Gross Margin',
      value: `${metrics?.margin?.toFixed(1) || 0}%`,
      sub: metrics?.margin >= 25 ? 'Healthy buffer' : 'Monitor closely',
      icon: Percent,
      color: metrics?.margin >= 25 ? 'green' : 'amber',
    },
    {
      label: 'Units Sold',
      value: fmt.num(metrics?.units),
      sub: `Avg ${(metrics?.units && metrics?.orders ? (metrics.units / metrics.orders).toFixed(1) : 0)} / order`,
      icon: Boxes,
      color: 'blue',
    },
    {
      label: 'Avg Order Value (AOV)',
      value: fmt.money(metrics?.aov),
      sub: 'Net revenue per order',
      icon: ShoppingCart,
      color: 'purple',
    },
    {
      label: 'Total Discounts',
      value: fmt.money(metrics?.discountAmount),
      sub: `${metrics?.grossSales ? ((metrics.discountAmount / metrics.grossSales) * 100).toFixed(1) : 0}% of gross sales`,
      icon: Tag,
      color: 'amber',
    },
  ];

  return (
    <div className="tf-page-content">
      {/* KPI Grid */}
      <div className="tf-kpi-grid">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className={`tf-kpi-card tf-kpi-${kpi.color}`}>
              <div className="tf-kpi-header">
                <span className="tf-kpi-label">{kpi.label}</span>
                <span className="tf-kpi-icon-wrap">
                  <Icon size={16} />
                </span>
              </div>
              <div className="tf-kpi-value">{kpi.value}</div>
              <div className="tf-kpi-sub">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="tf-grid-2col" style={{ marginTop: '20px' }}>
        <div className="tf-panel">
          <div className="tf-panel-header">
            <div>
              <h3 className="tf-panel-title">Revenue & Gross Profit Trend</h3>
              <p className="tf-panel-desc">Monthly financial trajectory over time</p>
            </div>
            <button className="tf-btn-ghost tf-btn-sm" onClick={() => onNavigate('sales')}>
              Deep Dive
            </button>
          </div>
          <div className="tf-panel-body">
            <RevenueTrendChart data={monthlyData} height={240} />
          </div>
        </div>

        <div className="tf-panel">
          <div className="tf-panel-header">
            <div>
              <h3 className="tf-panel-title">Sales by Category</h3>
              <p className="tf-panel-desc">Net revenue distribution across catalog</p>
            </div>
            <button className="tf-btn-ghost tf-btn-sm" onClick={() => onNavigate('products')}>
              View Catalog
            </button>
          </div>
          <div className="tf-panel-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CategoryDonutChart data={categoryData} height={190} />
            <div className="tf-donut-legend">
              {(categoryData || []).map((cat, i) => (
                <div key={cat.name} className="tf-donut-legend-item">
                  <span className="tf-legend-dot" style={{ background: ['#14b8a6', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][i % 5] }} />
                  <span className="tf-legend-name">{cat.name}</span>
                  <span className="tf-legend-val">{fmt.compact(cat.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Top Products & Recent Transactions */}
      <div className="tf-grid-2col" style={{ marginTop: '20px' }}>
        {/* Top Products */}
        <div className="tf-panel">
          <div className="tf-panel-header">
            <div>
              <h3 className="tf-panel-title">Top Revenue Drivers</h3>
              <p className="tf-panel-desc">Highest grossing catalog items</p>
            </div>
            <button className="tf-btn-ghost tf-btn-sm" onClick={() => onNavigate('products')}>
              All Products
            </button>
          </div>
          <div className="tf-panel-body">
            {topProducts.length === 0 ? (
              <div className="tf-empty">No products found</div>
            ) : (
              <div className="tf-rank-list">
                {topProducts.map((p, idx) => {
                  const maxRev = topProducts[0]?.revenue || 1;
                  const pct = Math.round((p.revenue / maxRev) * 100);
                  return (
                    <div key={p.product} className="tf-rank-item">
                      <div className="tf-rank-num">#{idx + 1}</div>
                      <div className="tf-rank-info">
                        <div className="tf-rank-top">
                          <span className="tf-rank-name">{p.product}</span>
                          <span className="tf-rank-rev">{fmt.money(p.revenue)}</span>
                        </div>
                        <div className="tf-progress-track">
                          <div className="tf-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="tf-rank-meta">
                          <span>{p.units} units</span>
                          <span>{p.category}</span>
                          <span className={p.margin >= 20 ? 'tf-text-green' : 'tf-text-amber'}>
                            {p.margin?.toFixed(1)}% margin
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="tf-panel">
          <div className="tf-panel-header">
            <div>
              <h3 className="tf-panel-title">Recent Transactions</h3>
              <p className="tf-panel-desc">Latest retail sales activity</p>
            </div>
            <button className="tf-btn-ghost tf-btn-sm" onClick={() => onNavigate('sales')}>
              All Transactions
            </button>
          </div>
          <div className="tf-panel-body" style={{ padding: 0 }}>
            <div className="tf-table-wrap">
              <table className="tf-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Region</th>
                    <th style={{ textAlign: 'right' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="tf-table-empty">No orders found</td>
                    </tr>
                  ) : (
                    recentOrders.map((ord) => (
                      <tr key={ord.order_id || ord.id}>
                        <td className="tf-mono">{ord.order_id || ord.id}</td>
                        <td className="tf-text-muted">{fmt.date(ord.order_date || ord.date)}</td>
                        <td className="tf-font-medium">{ord.product}</td>
                        <td>
                          <span className="tf-pill tf-pill-muted">{ord.region}</span>
                        </td>
                        <td style={{ textAlign: 'right' }} className="tf-font-medium">
                          {fmt.money(ord.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
