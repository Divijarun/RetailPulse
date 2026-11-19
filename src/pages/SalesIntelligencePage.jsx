import React, { useState, useMemo } from 'react';
import { fmt } from '../utils.js';
import { RevenueTrendChart } from '../components/Charts.jsx';
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Boxes,
  ArrowUpDown,
} from 'lucide-react';

export default function SalesIntelligencePage({
  salesRows,
  monthlyData,
  filterOptions,
  filters,
  onFilterChange,
  onResetFilters,
  onExportCSV,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('order_date');
  const [sortDir, setSortDir] = useState('desc');
  const pageSize = 15;

  // Filter salesRows by internal search input if any
  const filteredRows = useMemo(() => {
    let res = salesRows || [];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      res = res.filter(
        (r) =>
          (r.order_id || r.id || '').toLowerCase().includes(q) ||
          (r.product || '').toLowerCase().includes(q) ||
          (r.category || '').toLowerCase().includes(q) ||
          (r.region || '').toLowerCase().includes(q)
      );
    }
    // Sort
    return [...res].sort((a, b) => {
      let av = a[sortField];
      let bv = b[sortField];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [salesRows, searchTerm, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setCurrentPage(1);
  };

  // Quick aggregates
  const pageRevenue = filteredRows.reduce((s, r) => s + (Number(r.revenue) || 0), 0);
  const pageProfit = filteredRows.reduce((s, r) => s + (Number(r.gross_profit) || Number(r.profit) || 0), 0);
  const pageUnits = filteredRows.reduce((s, r) => s + (Number(r.units) || 0), 0);
  const pageMargin = pageRevenue > 0 ? (pageProfit / pageRevenue) * 100 : 0;

  return (
    <div className="tf-page-content">
      {/* Filter Bar */}
      <div className="tf-filter-bar">
        <div className="tf-filter-group">
          <label className="tf-filter-label">Month</label>
          <select
            className="tf-select"
            value={filters.month || ''}
            onChange={(e) => onFilterChange('month', e.target.value)}
          >
            <option value="">All Months</option>
            {(filterOptions?.months || []).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="tf-filter-group">
          <label className="tf-filter-label">Category</label>
          <select
            className="tf-select"
            value={filters.category || ''}
            onChange={(e) => onFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {(filterOptions?.categories || []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="tf-filter-group">
          <label className="tf-filter-label">Region</label>
          <select
            className="tf-select"
            value={filters.region || ''}
            onChange={(e) => onFilterChange('region', e.target.value)}
          >
            <option value="">All Regions</option>
            {(filterOptions?.regions || []).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="tf-filter-search">
          <Search size={14} className="tf-search-icon" />
          <input
            type="text"
            className="tf-input tf-input-sm"
            placeholder="Search order ID, product..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <button className="tf-btn-ghost tf-btn-sm" onClick={onResetFilters} title="Reset all filters">
          <RotateCcw size={13} />
          Reset
        </button>

        <button className="tf-btn-primary tf-btn-sm" onClick={onExportCSV} title="Export current dataset to CSV">
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {/* Mini Stats Ribbon */}
      <div className="tf-mini-stats">
        <div className="tf-mini-stat">
          <span className="tf-mini-stat-label">Matching Orders</span>
          <span className="tf-mini-stat-val">{fmt.num(filteredRows.length)}</span>
        </div>
        <div className="tf-mini-stat">
          <span className="tf-mini-stat-label">Net Revenue</span>
          <span className="tf-mini-stat-val tf-text-teal">{fmt.money(pageRevenue)}</span>
        </div>
        <div className="tf-mini-stat">
          <span className="tf-mini-stat-label">Gross Profit</span>
          <span className="tf-mini-stat-val tf-text-green">{fmt.money(pageProfit)}</span>
        </div>
        <div className="tf-mini-stat">
          <span className="tf-mini-stat-label">Gross Margin</span>
          <span className="tf-mini-stat-val">{pageMargin.toFixed(1)}%</span>
        </div>
        <div className="tf-mini-stat">
          <span className="tf-mini-stat-label">Units Sold</span>
          <span className="tf-mini-stat-val">{fmt.num(pageUnits)}</span>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="tf-panel" style={{ marginTop: '16px' }}>
        <div className="tf-panel-header">
          <div>
            <h3 className="tf-panel-title">Sales Revenue & Profit Trajectory</h3>
            <p className="tf-panel-desc">Visual monthly pacing for selected criteria</p>
          </div>
        </div>
        <div className="tf-panel-body">
          <RevenueTrendChart data={monthlyData} height={200} />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="tf-panel" style={{ marginTop: '16px' }}>
        <div className="tf-panel-header">
          <div>
            <h3 className="tf-panel-title">Order Records & Financials</h3>
            <p className="tf-panel-desc">
              Showing {filteredRows.length ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} transactions
            </p>
          </div>
          <div className="tf-table-pagination">
            <button
              className="tf-btn-ghost tf-btn-sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="tf-page-indicator">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="tf-btn-ghost tf-btn-sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>

        <div className="tf-panel-body" style={{ padding: 0 }}>
          <div className="tf-table-wrap">
            <table className="tf-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('order_id')} className="tf-sortable">
                    Order ID <ArrowUpDown size={11} />
                  </th>
                  <th onClick={() => toggleSort('order_date')} className="tf-sortable">
                    Date <ArrowUpDown size={11} />
                  </th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Region</th>
                  <th style={{ textAlign: 'right' }}>Units</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Discount</th>
                  <th style={{ textAlign: 'right' }} onClick={() => toggleSort('revenue')} className="tf-sortable">
                    Net Revenue <ArrowUpDown size={11} />
                  </th>
                  <th style={{ textAlign: 'right' }} onClick={() => toggleSort('gross_profit')} className="tf-sortable">
                    Gross Profit <ArrowUpDown size={11} />
                  </th>
                  <th style={{ textAlign: 'right' }}>Margin</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="tf-table-empty">
                      No records match the current filters.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r) => {
                    const rev = Number(r.revenue) || 0;
                    const profit = Number(r.gross_profit) || Number(r.profit) || 0;
                    const margin = rev > 0 ? (profit / rev) * 100 : 0;
                    const id = r.order_id || r.id;
                    const date = r.order_date || r.date;
                    const price = r.unit_price || r.price;
                    const disc = r.discount_pct !== undefined ? r.discount_pct : r.discount || 0;

                    return (
                      <tr key={id}>
                        <td className="tf-mono">{id}</td>
                        <td className="tf-text-muted">{fmt.date(date)}</td>
                        <td className="tf-font-medium">{r.product}</td>
                        <td>
                          <span className="tf-pill tf-pill-muted">{r.category}</span>
                        </td>
                        <td>
                          <span className="tf-pill tf-pill-muted">{r.region}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>{r.units}</td>
                        <td style={{ textAlign: 'right' }}>{fmt.money(price)}</td>
                        <td style={{ textAlign: 'right' }}>{disc}%</td>
                        <td style={{ textAlign: 'right' }} className="tf-font-medium tf-text-teal">
                          {fmt.money(rev)}
                        </td>
                        <td
                          style={{ textAlign: 'right' }}
                          className={profit < 0 ? 'tf-text-red tf-font-medium' : 'tf-text-green tf-font-medium'}
                        >
                          {fmt.money(profit)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span
                            className={`tf-pill ${
                              margin < 0
                                ? 'tf-pill-critical'
                                : margin < 15
                                ? 'tf-pill-warning'
                                : 'tf-pill-positive'
                            }`}
                          >
                            {margin.toFixed(1)}%
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
