import React, { useState, useMemo } from 'react';
import { fmt } from '../utils.js';
import { ProfitBarChart } from '../components/Charts.jsx';
import { Search, AlertTriangle, ArrowUpDown, TrendingUp } from 'lucide-react';

export default function ProductPerformancePage({ productData = [], onNavigate }) {
  const [tab, setTab] = useState('all'); // 'all' | 'bestsellers' | 'lowmargin'
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('revenue');
  const [sortDir, setSortDir] = useState('desc');

  const totalRevenue = useMemo(() => {
    return productData.reduce((sum, p) => sum + (Number(p.revenue) || 0), 0);
  }, [productData]);

  const filteredProducts = useMemo(() => {
    let list = [...productData];
    if (tab === 'bestsellers') {
      list = list.sort((a, b) => b.units - a.units).slice(0, 10);
    } else if (tab === 'lowmargin') {
      list = list.filter((p) => p.margin < 15 || p.profit < 0);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.product.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      let av = a[sortField];
      let bv = b[sortField];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [productData, tab, search, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const lossCount = productData.filter((p) => p.profit < 0).length;
  const lowMarginCount = productData.filter((p) => p.margin >= 0 && p.margin < 15).length;

  return (
    <div className="tf-page-content">
      {/* Risk Alert if loss-making or low margin products */}
      {lossCount > 0 && (
        <div className="tf-alert tf-alert-critical" style={{ marginBottom: '16px' }}>
          <AlertTriangle size={18} />
          <div>
            <strong>Action Required:</strong> {lossCount} product(s) are selling at a loss (negative gross profit).
            Review unit cost vs net selling price in the table below or test adjustments in the What-if Simulator.
          </div>
        </div>
      )}

      {/* Tabs and Controls */}
      <div className="tf-toolbar">
        <div className="tf-tabs">
          <button
            className={`tf-tab ${tab === 'all' ? 'active' : ''}`}
            onClick={() => setTab('all')}
          >
            All Products ({productData.length})
          </button>
          <button
            className={`tf-tab ${tab === 'bestsellers' ? 'active' : ''}`}
            onClick={() => setTab('bestsellers')}
          >
            Top Sellers (Volume)
          </button>
          <button
            className={`tf-tab ${tab === 'lowmargin' ? 'active' : ''}`}
            onClick={() => setTab('lowmargin')}
          >
            Underperforming / Low Margin ({lossCount + lowMarginCount})
          </button>
        </div>

        <div className="tf-filter-search" style={{ maxWidth: '280px' }}>
          <Search size={14} className="tf-search-icon" />
          <input
            type="text"
            className="tf-input tf-input-sm"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Profit Visualisation Panel */}
      <div className="tf-panel" style={{ marginTop: '16px' }}>
        <div className="tf-panel-header">
          <div>
            <h3 className="tf-panel-title">Gross Profit by Product</h3>
            <p className="tf-panel-desc">Visual comparison of gross earnings per catalog item</p>
          </div>
        </div>
        <div className="tf-panel-body">
          <ProfitBarChart data={productData} height={220} />
        </div>
      </div>

      {/* Detailed Product Table */}
      <div className="tf-panel" style={{ marginTop: '16px' }}>
        <div className="tf-panel-header">
          <div>
            <h3 className="tf-panel-title">Catalog Performance Matrix</h3>
            <p className="tf-panel-desc">Showing {filteredProducts.length} items</p>
          </div>
        </div>

        <div className="tf-panel-body" style={{ padding: 0 }}>
          <div className="tf-table-wrap">
            <table className="tf-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('product')} className="tf-sortable">
                    Product <ArrowUpDown size={11} />
                  </th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }} onClick={() => toggleSort('units')} className="tf-sortable">
                    Units Sold <ArrowUpDown size={11} />
                  </th>
                  <th style={{ textAlign: 'right' }} onClick={() => toggleSort('revenue')} className="tf-sortable">
                    Net Revenue <ArrowUpDown size={11} />
                  </th>
                  <th style={{ textAlign: 'right' }}>Revenue Share</th>
                  <th style={{ textAlign: 'right' }} onClick={() => toggleSort('profit')} className="tf-sortable">
                    Gross Profit <ArrowUpDown size={11} />
                  </th>
                  <th style={{ textAlign: 'right' }} onClick={() => toggleSort('margin')} className="tf-sortable">
                    Gross Margin <ArrowUpDown size={11} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="tf-table-empty">
                      No products match criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const revShare = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
                    const isLoss = p.profit < 0;
                    const isLowMargin = p.margin < 15 && !isLoss;

                    return (
                      <tr key={p.product} className={isLoss ? 'tf-row-loss' : ''}>
                        <td className="tf-font-medium">
                          {p.product}
                          {isLoss && (
                            <span className="tf-pill tf-pill-critical" style={{ marginLeft: 8 }}>
                              Loss Maker
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="tf-pill tf-pill-muted">{p.category || 'General'}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>{fmt.num(p.units)}</td>
                        <td style={{ textAlign: 'right' }} className="tf-font-medium tf-text-teal">
                          {fmt.money(p.revenue)}
                        </td>
                        <td style={{ textAlign: 'right', minWidth: '130px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <span className="tf-text-muted" style={{ fontSize: '11px', width: '36px' }}>
                              {revShare.toFixed(1)}%
                            </span>
                            <div className="tf-progress-track" style={{ width: '60px' }}>
                              <div className="tf-progress-fill" style={{ width: `${Math.min(100, revShare * 2)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td
                          style={{ textAlign: 'right' }}
                          className={isLoss ? 'tf-text-red tf-font-medium' : 'tf-text-green tf-font-medium'}
                        >
                          {fmt.money(p.profit)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span
                            className={`tf-pill ${
                              isLoss
                                ? 'tf-pill-critical'
                                : isLowMargin
                                ? 'tf-pill-warning'
                                : 'tf-pill-positive'
                            }`}
                          >
                            {p.margin?.toFixed(1)}%
                          </span>
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
