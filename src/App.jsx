import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  DollarSign,
  MapPin,
  Brain,
  Sliders,
  UploadCloud,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  RefreshCw,
  Download,
  AlertCircle,
  ShieldCheck,
  Building,
} from 'lucide-react';

import { fmt, normaliseDemoRow, groupAndAggregate, sortBy } from './utils.js';
import { demoSales } from './demoData.js';

// Page Views
import OverviewPage from './pages/OverviewPage.jsx';
import SalesIntelligencePage from './pages/SalesIntelligencePage.jsx';
import ProductPerformancePage from './pages/ProductPerformancePage.jsx';
import ProfitabilityPage from './pages/ProfitabilityPage.jsx';
import RegionalPage from './pages/RegionalPage.jsx';
import DecisionEnginePage from './pages/DecisionEnginePage.jsx';
import WhatIfPage from './pages/WhatIfPage.jsx';
import DataManagementPage from './pages/DataManagementPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

import './App.css';

const NAV_ITEMS = [
  { id: 'overview',      label: 'Overview',                icon: LayoutDashboard },
  { id: 'sales',         label: 'Sales Intelligence',      icon: TrendingUp },
  { id: 'products',      label: 'Product Performance',     icon: Package },
  { id: 'profitability', label: 'Profitability Analysis',  icon: DollarSign },
  { id: 'regional',      label: 'Regional Analysis',       icon: MapPin },
  { id: 'decisions',     label: 'Business Decision Engine', icon: Brain, badge: 'AI' },
  { id: 'whatif',        label: 'What-if Simulator',       icon: Sliders },
  { id: 'data',          label: 'Data Management',         icon: UploadCloud },
  { id: 'reports',       label: 'Reports',                 icon: FileText },
  { id: 'settings',      label: 'Settings',                icon: Settings },
];

export default function App() {
  const [activePage, setActivePage] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dataSource, setDataSource] = useState('live'); // 'live' | 'demo'
  const [loading, setLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);

  // Global Filter State
  const [filters, setFilters] = useState({
    month: '',
    category: '',
    region: '',
    search: '',
  });

  const [filterOptions, setFilterOptions] = useState({
    months: [],
    categories: [],
    regions: [],
  });

  // Analytics Datasets
  const [metrics, setMetrics] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [regionalData, setRegionalData] = useState([]);
  const [salesRows, setSalesRows] = useState([]);

  // Normalised Demo Data Memo
  const demoNormalised = useMemo(() => {
    return demoSales.map(normaliseDemoRow);
  }, []);

  // Compute Demo Mode Analytics in Memory
  const computeDemoAnalytics = useCallback(() => {
    let rows = demoNormalised;
    if (filters.month) rows = rows.filter((r) => r.order_date.startsWith(filters.month));
    if (filters.category) rows = rows.filter((r) => r.category === filters.category);
    if (filters.region) rows = rows.filter((r) => r.region === filters.region);

    const orders = rows.length;
    const units = rows.reduce((s, r) => s + r.units, 0);
    const grossSales = rows.reduce((s, r) => s + r.grossSales, 0);
    const discountAmount = rows.reduce((s, r) => s + r.discountAmount, 0);
    const revenue = rows.reduce((s, r) => s + r.revenue, 0);
    const cogs = rows.reduce((s, r) => s + r.cogs, 0);
    const profit = rows.reduce((s, r) => s + r.grossProfit, 0);
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const aov = orders > 0 ? revenue / orders : 0;

    setMetrics({
      orders,
      units,
      grossSales,
      discountAmount,
      revenue,
      cogs,
      profit,
      margin,
      aov,
    });

    // Monthly
    const monthGroup = groupAndAggregate(rows, (r) => r.order_date.slice(0, 7));
    setMonthlyData(
      monthGroup.map((m) => ({
        month: m.name,
        revenue: m.revenue,
        profit: m.profit,
        units: m.units,
      }))
    );

    // Categories
    const catGroup = groupAndAggregate(rows, (r) => r.category);
    setCategoryData(
      catGroup.map((c) => ({
        name: c.name,
        revenue: c.revenue,
        profit: c.profit,
        units: c.units,
        margin: c.margin,
        cogs: c.cogs,
      }))
    );

    // Products
    const prodGroup = groupAndAggregate(rows, (r) => r.product);
    setProductData(
      prodGroup.map((p) => {
        const sampleRow = rows.find((r) => r.product === p.name);
        return {
          product: p.name,
          category: sampleRow ? sampleRow.category : 'General',
          revenue: p.revenue,
          profit: p.profit,
          units: p.units,
          margin: p.margin,
          cogs: p.cogs,
        };
      })
    );

    // Regions
    const regGroup = groupAndAggregate(rows, (r) => r.region);
    setRegionalData(
      regGroup.map((rg) => ({
        region: rg.name,
        orders: rg.orders,
        revenue: rg.revenue,
        profit: rg.profit,
        units: rg.units,
        margin: rg.margin,
      }))
    );

    setSalesRows(rows);

    // Filter options from demo
    const months = [...new Set(demoNormalised.map((r) => r.order_date.slice(0, 7)))].sort();
    const categories = [...new Set(demoNormalised.map((r) => r.category))].sort();
    const regions = [...new Set(demoNormalised.map((r) => r.region))].sort();
    setFilterOptions({ months, categories, regions });
  }, [demoNormalised, filters]);

  // Live Database Fetch
  const fetchLiveAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('companyId', '1');
      if (filters.month) q.set('month', filters.month);
      if (filters.category) q.set('category', filters.category);
      if (filters.region) q.set('region', filters.region);
      const queryStr = q.toString() ? `?${q.toString()}` : '';

      const [resOverview, resRev, resCat, resProd, resReg, resFilters, resSales] =
        await Promise.all([
          fetch(`/api/analytics/overview${queryStr}`),
          fetch(`/api/analytics/revenue${queryStr}`),
          fetch(`/api/analytics/categories${queryStr}`),
          fetch(`/api/analytics/products${queryStr}`),
          fetch(`/api/analytics/regions${queryStr}`),
          fetch(`/api/analytics/filters?companyId=1`),
          fetch(`/api/sales${queryStr ? queryStr + '&limit=500' : '?limit=500'}`),
        ]);

      if (!resOverview.ok) {
        throw new Error('API request failed');
      }

      const dOverview = await resOverview.json();
      const dRev = await resRev.json();
      const dCat = await resCat.json();
      const dProd = await resProd.json();
      const dReg = await resReg.json();
      const dFilters = await resFilters.json();
      const dSales = await resSales.json();

      const rawOverview = dOverview.data || dOverview.overview || {};
      const rev = Number(rawOverview.revenue || 0);
      const orders = Number(rawOverview.orders || 0);
      setMetrics({
        orders,
        units: Number(rawOverview.units || 0),
        grossSales: Number(rawOverview.grossSales || 0),
        discountAmount: Number(rawOverview.discountAmount || 0),
        revenue: rev,
        cogs: Number(rawOverview.cogs || 0),
        profit: Number(rawOverview.profit || 0),
        margin: Number(rawOverview.margin || 0),
        aov: orders > 0 ? rev / orders : 0,
      });

      const rawMonthly = dRev.data || dRev.monthly || [];
      setMonthlyData(
        rawMonthly.map((m) => ({
          month: m.month || m.key,
          revenue: m.revenue || 0,
          profit: m.profit || 0,
          units: m.units || 0,
        }))
      );

      const rawCat = dCat.data || dCat.categories || [];
      setCategoryData(
        rawCat.map((c) => ({
          name: c.name || c.category,
          revenue: c.revenue || 0,
          profit: c.profit || 0,
          units: c.units || 0,
          margin: c.margin || 0,
          cogs: c.cogs || (c.revenue - c.profit),
        }))
      );

      const rawProd = dProd.data || dProd.products || [];
      setProductData(
        rawProd.map((p) => ({
          product: p.product,
          category: p.category,
          revenue: p.revenue || 0,
          profit: p.profit || 0,
          units: p.units || 0,
          margin: p.margin || 0,
          cogs: p.cogs || 0,
        }))
      );

      const rawReg = dReg.data || dReg.regions || [];
      setRegionalData(
        rawReg.map((r) => ({
          region: r.region,
          orders: r.orderCount || r.orders || 0,
          revenue: r.revenue || 0,
          profit: r.profit || 0,
          units: r.units || 0,
          margin: r.margin || 0,
        }))
      );

      const rawFilters = dFilters.data || dFilters || {};
      setFilterOptions({
        months: rawFilters.months || [],
        categories: rawFilters.categories || [],
        regions: rawFilters.regions || [],
      });

      setSalesRows(dSales.data || dSales.sales || []);
      setDbConnected(true);
    } catch (err) {
      console.warn('Backend SQLite API unavailable or empty, falling back to Demo Mode:', err.message);
      setDbConnected(false);
      setDataSource('demo');
      computeDemoAnalytics();
    } finally {
      setLoading(false);
    }
  }, [filters, computeDemoAnalytics]);

  // Load data on change of source or filters
  useEffect(() => {
    if (dataSource === 'live') {
      fetchLiveAnalytics();
    } else {
      computeDemoAnalytics();
    }
  }, [dataSource, filters, fetchLiveAnalytics, computeDemoAnalytics]);

  // Filter Handlers
  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const handleResetFilters = () => {
    setFilters({ month: '', category: '', region: '', search: '' });
  };

  // CSV Export Action
  const handleExportCSV = () => {
    if (!salesRows || salesRows.length === 0) {
      alert('No data available to export.');
      return;
    }
    const headers = [
      'Order ID',
      'Date',
      'Product',
      'Category',
      'Region',
      'Units',
      'Unit Price',
      'Unit Cost',
      'Discount %',
      'Net Revenue',
      'Gross Profit',
      'Gross Margin %',
    ];
    const csvLines = [headers.join(',')];

    salesRows.forEach((r) => {
      const row = [
        `"${r.order_id || r.id || ''}"`,
        `"${r.order_date || r.date || ''}"`,
        `"${r.product || ''}"`,
        `"${r.category || ''}"`,
        `"${r.region || ''}"`,
        r.units || 0,
        r.unit_price || r.price || 0,
        r.unit_cost || r.cost || 0,
        r.discount_pct !== undefined ? r.discount_pct : r.discount || 0,
        r.revenue || 0,
        r.gross_profit || r.profit || 0,
        (r.gross_margin !== undefined ? r.gross_margin : r.margin || 0).toFixed(2),
      ];
      csvLines.push(row.join(','));
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tradeframe_sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Callback after successful file import
  const handleImportSuccess = () => {
    setDataSource('live');
    fetchLiveAnalytics();
    setActivePage('overview');
  };

  const activeNav = NAV_ITEMS.find((n) => n.id === activePage) || NAV_ITEMS[0];

  return (
    <div className="tf-shell">
      {/* Collapsible Sidebar */}
      <aside className={`tf-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Brand Header */}
        <div className="tf-sidebar-header">
          <div className="tf-brand-mark">TF</div>
          {!sidebarCollapsed && (
            <div className="tf-brand-text">
              <h1>TRADEFRAME</h1>
              <p>DECISION INTELLIGENCE</p>
            </div>
          )}
          <button
            className="tf-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="tf-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                className={`tf-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActivePage(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="tf-nav-icon">
                  <Icon size={18} />
                </span>
                {!sidebarCollapsed && (
                  <span className="tf-nav-label">
                    {item.label}
                    {item.badge && <span className="tf-nav-badge">{item.badge}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer / System Status */}
        <div className="tf-sidebar-footer">
          <div className="tf-db-status">
            <span
              className={`tf-status-dot ${
                dataSource === 'live' && dbConnected ? 'online' : 'demo'
              }`}
            />
            {!sidebarCollapsed && (
              <div className="tf-db-status-text">
                <span className="tf-db-mode">
                  {dataSource === 'live' ? 'SQLite Engine' : 'Demo Sandbox'}
                </span>
                <span className="tf-db-sub">TF-MAIN • v2.0</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`tf-main ${sidebarCollapsed ? 'expanded' : ''}`}>
        {/* Top Header Bar */}
        <header className="tf-topbar">
          <div className="tf-topbar-left">
            <div className="tf-breadcrumb">
              <span className="tf-breadcrumb-root">Tradeframe</span>
              <span className="tf-breadcrumb-sep">/</span>
              <span className="tf-breadcrumb-current">{activeNav.label}</span>
            </div>
            <div className="tf-tagline">From business data to better decisions</div>
          </div>

          <div className="tf-topbar-right">
            {/* Live DB / Demo Mode Toggle */}
            <div className="tf-mode-toggle">
              <button
                className={`tf-mode-btn ${dataSource === 'demo' ? 'active' : ''}`}
                onClick={() => setDataSource('demo')}
                title="Use offline demo dataset"
              >
                Demo
              </button>
              <button
                className={`tf-mode-btn ${dataSource === 'live' ? 'active' : ''}`}
                onClick={() => setDataSource('live')}
                title="Connect to SQLite database"
              >
                <Database size={12} style={{ display: 'inline', marginRight: 4 }} />
                Live DB
              </button>
            </div>

            {/* Refresh Button */}
            <button
              className="tf-btn-ghost tf-btn-sm"
              onClick={dataSource === 'live' ? fetchLiveAnalytics : computeDemoAnalytics}
              disabled={loading}
              title="Refresh dataset from source"
            >
              <RefreshCw size={13} className={loading ? 'tf-spin' : ''} />
              <span className="tf-hide-mobile">Refresh</span>
            </button>

            {/* Export CSV Button */}
            <button
              className="tf-btn-primary tf-btn-sm"
              onClick={handleExportCSV}
              title="Download current data view as CSV"
            >
              <Download size={13} />
              <span className="tf-hide-mobile">Export CSV</span>
            </button>
          </div>
        </header>

        {/* Page View Body */}
        <main className="tf-page-wrapper">
          {activePage === 'overview' && (
            <OverviewPage
              metrics={metrics}
              monthlyData={monthlyData}
              categoryData={categoryData}
              productData={productData}
              salesRows={salesRows}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'sales' && (
            <SalesIntelligencePage
              salesRows={salesRows}
              monthlyData={monthlyData}
              filterOptions={filterOptions}
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              onExportCSV={handleExportCSV}
            />
          )}

          {activePage === 'products' && (
            <ProductPerformancePage
              productData={productData}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'profitability' && (
            <ProfitabilityPage
              metrics={metrics}
              categoryData={categoryData}
              productData={productData}
              regionalData={regionalData}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'regional' && (
            <RegionalPage
              regionalData={regionalData}
              salesRows={salesRows}
            />
          )}

          {activePage === 'decisions' && (
            <DecisionEnginePage
              isLive={dataSource === 'live'}
              salesRows={salesRows}
              filters={filters}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'whatif' && (
            <WhatIfPage
              productData={productData}
              salesRows={salesRows}
            />
          )}

          {activePage === 'data' && (
            <DataManagementPage
              isLive={dataSource === 'live'}
              onImportSuccess={handleImportSuccess}
              onSwitchToDashboard={() => setActivePage('overview')}
              onToggleSource={setDataSource}
            />
          )}

          {activePage === 'reports' && (
            <ReportsPage
              metrics={metrics}
              productData={productData}
              regionalData={regionalData}
              categoryData={categoryData}
              onExportCSV={handleExportCSV}
            />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              isLive={dataSource === 'live'}
              onToggleSource={setDataSource}
              onRefresh={fetchLiveAnalytics}
            />
          )}
        </main>
      </div>
    </div>
  );
}
