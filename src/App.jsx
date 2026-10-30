
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowDownToLine,
  ArrowUpRight,
  Boxes,
  ChevronDown,
  CircleDollarSign,
  Download,
  LayoutDashboard,
  Lightbulb,
  Package,
  Search,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import "./App.css";

const sales = [
  { id: "ORD-1001", date: "2026-01-05", product: "Wireless Mouse", category: "Electronics", region: "North", units: 18, price: 899, cost: 480, discount: 5 },
  { id: "ORD-1002", date: "2026-01-09", product: "Office Chair", category: "Furniture", region: "West", units: 4, price: 6499, cost: 4300, discount: 10 },
  { id: "ORD-1003", date: "2026-01-14", product: "Notebook Set", category: "Stationery", region: "South", units: 32, price: 299, cost: 155, discount: 0 },
  { id: "ORD-1004", date: "2026-01-21", product: "Bluetooth Speaker", category: "Electronics", region: "East", units: 9, price: 2499, cost: 1600, discount: 8 },
  { id: "ORD-1005", date: "2026-02-03", product: "Desk Lamp", category: "Furniture", region: "North", units: 13, price: 1299, cost: 700, discount: 5 },
  { id: "ORD-1006", date: "2026-02-08", product: "Premium Pens", category: "Stationery", region: "West", units: 26, price: 199, cost: 85, discount: 0 },
  { id: "ORD-1007", date: "2026-02-15", product: "Mechanical Keyboard", category: "Electronics", region: "South", units: 7, price: 3499, cost: 2200, discount: 12 },
  { id: "ORD-1008", date: "2026-02-24", product: "Bookshelf", category: "Furniture", region: "East", units: 3, price: 7999, cost: 5600, discount: 8 },
  { id: "ORD-1009", date: "2026-03-04", product: "Wireless Mouse", category: "Electronics", region: "West", units: 24, price: 899, cost: 480, discount: 0 },
  { id: "ORD-1010", date: "2026-03-10", product: "Notebook Set", category: "Stationery", region: "North", units: 41, price: 299, cost: 155, discount: 5 },
  { id: "ORD-1011", date: "2026-03-17", product: "Office Chair", category: "Furniture", region: "South", units: 6, price: 6499, cost: 4300, discount: 15 },
  { id: "ORD-1012", date: "2026-03-26", product: "Bluetooth Speaker", category: "Electronics", region: "East", units: 12, price: 2499, cost: 1600, discount: 5 },
  { id: "ORD-1013", date: "2026-04-02", product: "Premium Pens", category: "Stationery", region: "North", units: 35, price: 199, cost: 85, discount: 0 },
  { id: "ORD-1014", date: "2026-04-11", product: "Desk Lamp", category: "Furniture", region: "West", units: 17, price: 1299, cost: 700, discount: 10 },
  { id: "ORD-1015", date: "2026-04-16", product: "Mechanical Keyboard", category: "Electronics", region: "South", units: 11, price: 3499, cost: 2200, discount: 5 },
  { id: "ORD-1016", date: "2026-04-27", product: "Notebook Set", category: "Stationery", region: "East", units: 48, price: 299, cost: 155, discount: 0 },
  { id: "ORD-1017", date: "2026-05-05", product: "Bookshelf", category: "Furniture", region: "North", units: 5, price: 7999, cost: 5600, discount: 12 },
  { id: "ORD-1018", date: "2026-05-12", product: "Wireless Mouse", category: "Electronics", region: "South", units: 29, price: 899, cost: 480, discount: 8 },
  { id: "ORD-1019", date: "2026-05-19", product: "Premium Pens", category: "Stationery", region: "West", units: 44, price: 199, cost: 85, discount: 5 },
  { id: "ORD-1020", date: "2026-05-28", product: "Office Chair", category: "Furniture", region: "East", units: 7, price: 6499, cost: 4300, discount: 5 },
  { id: "ORD-1021", date: "2026-06-03", product: "Bluetooth Speaker", category: "Electronics", region: "North", units: 15, price: 2499, cost: 1600, discount: 0 },
  { id: "ORD-1022", date: "2026-06-09", product: "Notebook Set", category: "Stationery", region: "South", units: 53, price: 299, cost: 155, discount: 5 },
  { id: "ORD-1023", date: "2026-06-18", product: "Desk Lamp", category: "Furniture", region: "East", units: 21, price: 1299, cost: 700, discount: 5 },
  { id: "ORD-1024", date: "2026-06-25", product: "Mechanical Keyboard", category: "Electronics", region: "West", units: 14, price: 3499, cost: 2200, discount: 10 },
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const compactMoney = (value) =>
  value >= 100000
    ? `₹${(value / 100000).toFixed(1)}L`
    : value >= 1000
      ? `₹${(value / 1000).toFixed(1)}k`
      : `₹${Math.round(value)}`;

const formatDate = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const categories = ["All categories", ...new Set(sales.map((s) => s.category))];
const months = [
  { value: "all", label: "All months" },
  ...Array.from({ length: 6 }, (_, i) => ({
    value: `2026-${String(i + 1).padStart(2, "0")}`,
    label: new Date(2026, i, 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    }),
  })),
];

function calculateRevenue(row) {
  return row.units * row.price * (1 - row.discount / 100);
}

function calculateProfit(row) {
  return calculateRevenue(row) - row.units * row.cost;
}

function MetricCard({ title, value, note, icon: Icon, tone, change }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{title}</span>
        <span className={`metric-icon ${tone}`}>
          <Icon size={19} />
        </span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-foot">
        {change === undefined ? null : (
          <span className={change >= 0 ? "change positive" : "change negative"}>
            {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
        <span>{note}</span>
      </div>
    </article>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <div key={item.dataKey} className="tooltip-line">
          <span style={{ background: item.color }} className="tooltip-dot" />
          <span>{item.name}</span>
          <b>{money(item.value)}</b>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [category, setCategory] = useState("All categories");
  const [month, setMonth] = useState("all");
  const [region, setRegion] = useState("All regions");
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState("Overview");

  const filteredSales = useMemo(
    () =>
      sales.filter((row) => {
        const matchesCategory =
          category === "All categories" || row.category === category;
        const matchesMonth = month === "all" || row.date.startsWith(month);
        const matchesRegion = region === "All regions" || row.region === region;
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          [row.id, row.product, row.category, row.region]
            .some((value) => value.toLowerCase().includes(query));

        return matchesCategory && matchesMonth && matchesRegion && matchesSearch;
      }),
    [category, month, region, search]
  );

  const metrics = useMemo(() => {
    const revenue = filteredSales.reduce((sum, row) => sum + calculateRevenue(row), 0);
    const profit = filteredSales.reduce((sum, row) => sum + calculateProfit(row), 0);
    const units = filteredSales.reduce((sum, row) => sum + row.units, 0);
    const orders = filteredSales.length;
    const margin = revenue ? (profit / revenue) * 100 : 0;

    return { revenue, profit, units, orders, margin };
  }, [filteredSales]);

  const monthlyData = useMemo(() => {
    const grouped = new Map();

    filteredSales.forEach((row) => {
      const key = row.date.slice(0, 7);
      if (!grouped.has(key)) grouped.set(key, { key, revenue: 0, profit: 0 });
      const entry = grouped.get(key);
      entry.revenue += calculateRevenue(row);
      entry.profit += calculateProfit(row);
    });

    return [...grouped.values()]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((item) => ({
        ...item,
        month: new Date(`${item.key}-01T00:00:00`).toLocaleDateString("en-IN", {
          month: "short",
        }),
      }));
  }, [filteredSales]);

  const categoryData = useMemo(() => {
    const grouped = new Map();

    filteredSales.forEach((row) => {
      if (!grouped.has(row.category)) {
        grouped.set(row.category, { name: row.category, revenue: 0, profit: 0 });
      }
      const item = grouped.get(row.category);
      item.revenue += calculateRevenue(row);
      item.profit += calculateProfit(row);
    });

    return [...grouped.values()].sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  const productData = useMemo(() => {
    const grouped = new Map();

    filteredSales.forEach((row) => {
      if (!grouped.has(row.product)) {
        grouped.set(row.product, {
          product: row.product,
          category: row.category,
          revenue: 0,
          profit: 0,
          units: 0,
        });
      }
      const item = grouped.get(row.product);
      item.revenue += calculateRevenue(row);
      item.profit += calculateProfit(row);
      item.units += row.units;
    });

    return [...grouped.values()].sort((a, b) => b.profit - a.profit);
  }, [filteredSales]);

  const insights = useMemo(() => {
    if (!filteredSales.length) {
      return [{
        title: "No matching data",
        text: "Change or clear your filters to generate business insights.",
        type: "neutral",
      }];
    }

    const bestCategory = [...categoryData].sort((a, b) => b.profit - a.profit)[0];
    const lowestMarginCategory = [...categoryData].sort(
      (a, b) => a.revenue ? a.profit / a.revenue : Infinity
    )[0];
    const bestProduct = productData[0];
    const avgDiscount =
      filteredSales.reduce((sum, row) => sum + row.discount, 0) /
      filteredSales.length;

    const results = [
      {
        title: `${bestCategory.name} leads profit`,
        text: `This category generated ${money(bestCategory.profit)} in gross profit in the selected dataset.`,
        type: "positive",
      },
      {
        title: `${lowestMarginCategory.name}: review margins`,
        text: `Its gross margin is ${lowestMarginCategory.revenue ? ((lowestMarginCategory.profit / lowestMarginCategory.revenue) * 100).toFixed(1) : "0.0"}%. Review costs, pricing, and discounts before changing prices.`,
        type: "warning",
      },
      {
        title: `${bestProduct.product} leads product profit`,
        text: `It generated ${money(bestProduct.profit)} in gross profit across ${bestProduct.units} units sold.`,
        type: "positive",
      },
      {
        title: "Discount monitoring",
        text: `The average transaction-level discount rate is ${avgDiscount.toFixed(1)}%. Compare discounted orders with full-price orders before changing promotions.`,
        type: "neutral",
      },
    ];

    return results;
  }, [filteredSales, categoryData, productData]);

  function exportCSV() {
    const headers = [
      "Order ID", "Date", "Product", "Category", "Region",
      "Units", "Unit Price (INR)", "Unit Cost (INR)", "Discount (%)",
      "Revenue (INR)", "Gross Profit (INR)", "Gross Margin (%)",
    ];

    const rows = filteredSales.map((row) => {
      const revenue = calculateRevenue(row);
      const profit = calculateProfit(row);
      return [
        row.id, row.date, row.product, row.category, row.region,
        row.units, row.price, row.cost, row.discount,
        revenue.toFixed(2), profit.toFixed(2),
        revenue ? ((profit / revenue) * 100).toFixed(2) : "0.00",
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "retailpulse-sales-analysis.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const pages = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Sales explorer", icon: ShoppingCart },
    { label: "Products", icon: Package },
    { label: "Business insights", icon: Lightbulb },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setActivePage("Overview")}>
          <span className="brand-mark"><Activity size={23} /></span>
          <span>retail<span className="brand-accent">pulse</span><small>BUSINESS INTELLIGENCE</small></span>
        </a>

        <div className="nav-heading">WORKSPACE</div>
        <nav className="sidebar-nav">
          {pages.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "active" : ""}`}
              onClick={() => {
                setActivePage(label);
                document.getElementById(
                  label === "Overview" ? "overview" :
                  label === "Sales explorer" ? "transactions" :
                  label === "Products" ? "products" : "insights"
                )?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="dataset-card">
          <span className="dataset-dot" />
          <div>
            <strong>Demo dataset</strong>
            <span>Jan – Jun 2026</span>
          </div>
        </div>
        <div className="sidebar-footer">RETAILPULSE · V1.0.0</div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{activePage}</strong></div>
          <div className="topbar-right">
            <span className="demo-badge"><span /> Sample data</span>
            <button className="export-button" onClick={exportCSV}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </header>

        <section className="page-heading">
          <div>
            <div className="eyebrow">RETAIL PERFORMANCE</div>
            <h1>Sales overview<span className="heading-period">.</span></h1>
            <p>Understand what's driving revenue, profit, and product performance.</p>
          </div>
          <div className="period-control">
            <span>REPORTING PERIOD</span>
            <div className="select-wrap">
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                {months.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>
          </div>
        </section>

        <section className="filter-bar" aria-label="Dashboard filters">
          <div className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders, products..."
              aria-label="Search orders and products"
            />
          </div>
          <div className="filter-divider" />
          <label className="filter-field">
            <span>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="filter-field">
            <span>Region</span>
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              {["All regions", "North", "South", "East", "West"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <button className="clear-filters" onClick={() => {
            setCategory("All categories");
            setMonth("all");
            setRegion("All regions");
            setSearch("");
          }}>Reset</button>
        </section>

        <section className="metrics-grid">
          <MetricCard title="Total revenue" value={money(metrics.revenue)} note="After discounts" icon={CircleDollarSign} tone="violet" />
          <MetricCard title="Gross profit" value={money(metrics.profit)} note="Revenue minus product cost" icon={TrendingUp} tone="green" />
          <MetricCard title="Gross margin" value={`${metrics.margin.toFixed(1)}%`} note="Profit as % of revenue" icon={Activity} tone="amber" />
          <MetricCard title="Orders" value={metrics.orders.toLocaleString("en-IN")} note={`${metrics.units.toLocaleString("en-IN")} units sold`} icon={ShoppingCart} tone="blue" />
        </section>

        <section className="charts-grid">
          <article className="panel revenue-panel">
            <div className="panel-heading">
              <div>
                <h2>Revenue & profitability</h2>
                <p>Monthly performance over the selected period</p>
              </div>
              <span className="chart-tag"><span /> INR</span>
            </div>
            <div className="chart-legend">
              <span><i className="legend-revenue" /> Revenue</span>
              <span><i className="legend-profit" /> Gross profit</span>
            </div>
            <div className="chart-area">
              {monthlyData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 12, right: 8, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7770ef" stopOpacity={0.19} />
                        <stop offset="100%" stopColor="#7770ef" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#20b486" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#20b486" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#edf0f5" strokeDasharray="3 5" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#8b93a5", fontSize: 12 }} dy={10} />
                    <YAxis tickFormatter={compactMoney} axisLine={false} tickLine={false} tick={{ fill: "#8b93a5", fontSize: 11 }} width={53} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7770ef" strokeWidth={2.5} fill="url(#revenueFill)" activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="profit" name="Gross profit" stroke="#20b486" strokeWidth={2.5} fill="url(#profitFill)" activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="empty-state">No data for these filters.</div>}
            </div>
            <div className="panel-footnote">Revenue = units × selling price × (1 − discount rate).</div>
          </article>

          <article className="panel category-panel">
            <div className="panel-heading">
              <div>
                <h2>Category performance</h2>
                <p>Revenue contribution by category</p>
              </div>
              <span className="mini-icon"><Boxes size={18} /></span>
            </div>
            <div className="category-chart">
              {categoryData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="revenue" nameKey="name" cx="50%" cy="50%" innerRadius={64} outerRadius={91} paddingAngle={4} stroke="none">
                      {categoryData.map((item, index) => (
                        <Cell key={item.name} fill={["#7770ef", "#20b486", "#f4b544", "#60a5fa"][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => money(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-state">No data</div>}
              <div className="donut-center">
                <span>TOTAL</span>
                <strong>{compactMoney(metrics.revenue)}</strong>
              </div>
            </div>
            <div className="category-legend">
              {categoryData.map((item, index) => (
                <div className="category-legend-row" key={item.name}>
                  <span className="category-name">
                    <i style={{ background: ["#7770ef", "#20b486", "#f4b544", "#60a5fa"][index % 4] }} />
                    {item.name}
                  </span>
                  <strong>{metrics.revenue ? ((item.revenue / metrics.revenue) * 100).toFixed(1) : "0.0"}%</strong>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="lower-grid">
          <article className="panel product-panel" id="products">
            <div className="panel-heading">
              <div>
                <h2>Top products</h2>
                <p>Ranked by gross profit contribution</p>
              </div>
              <span className="mini-icon"><Package size={18} /></span>
            </div>
            {productData.length ? (
              <div className="product-list">
                {productData.slice(0, 5).map((item, index) => {
                  const maxProfit = productData[0].profit || 1;
                  return (
                    <div className="product-row" key={item.product}>
                      <span className={`product-rank rank-${index + 1}`}>{String(index + 1).padStart(2, "0")}</span>
                      <div className="product-info">
                        <div className="product-name-line">
                          <strong>{item.product}</strong>
                          <span>{item.category}</span>
                        </div>
                        <div className="product-bar"><span style={{ width: `${(item.profit / maxProfit) * 100}%` }} /></div>
                      </div>
                      <div className="product-result">
                        <strong>{money(item.profit)}</strong>
                        <span>{item.units} units</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="empty-state">No products match the filters.</div>}
          </article>

          <article className="panel insights-panel" id="insights">
            <div className="panel-heading">
              <div>
                <h2>Business insights</h2>
                <p>Observations from the selected data</p>
              </div>
              <span className="insights-icon"><Lightbulb size={18} /></span>
            </div>
            <div className="insight-list">
              {insights.map((item, index) => (
                <div className="insight-item" key={item.title}>
                  <span className={`insight-number ${item.type}`}>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="insight-disclaimer">Insights are descriptive, rule-based observations—not forecasts or causal conclusions.</p>
          </article>
        </section>

        <section className="panel transactions-panel" id="transactions">
          <div className="panel-heading transaction-heading">
            <div>
              <h2>Recent transactions</h2>
              <p>Review order-level sales and gross profit</p>
            </div>
            <span className="record-count">{filteredSales.length} records</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>DATE</th>
                  <th>PRODUCT</th>
                  <th>CATEGORY</th>
                  <th>REGION</th>
                  <th className="numeric">UNITS</th>
                  <th className="numeric">DISCOUNT</th>
                  <th className="numeric">REVENUE</th>
                  <th className="numeric">GROSS PROFIT</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length ? filteredSales.map((row) => {
                  const revenue = calculateRevenue(row);
                  const profit = calculateProfit(row);
                  return (
                    <tr key={row.id}>
                      <td className="order-id">{row.id}</td>
                      <td>{formatDate(row.date)}</td>
                      <td className="table-product">{row.product}</td>
                      <td><span className="category-pill">{row.category}</span></td>
                      <td>{row.region}</td>
                      <td className="numeric">{row.units}</td>
                      <td className="numeric">{row.discount}%</td>
                      <td className="numeric">{money(revenue)}</td>
                      <td className="numeric profit-cell">{money(profit)}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="9" className="table-empty">No transactions found. Try changing your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>Showing {filteredSales.length} of {sales.length} sample transactions</span>
            <button className="text-export" onClick={exportCSV}><ArrowDownToLine size={15} /> Download data</button>
          </div>
        </section>

        <footer className="page-footer">
          <span>RetailPulse <span className="footer-separator">/</span> Sales & Profit Intelligence</span>
          <span><span className="footer-dot" /> Demo environment · Synthetic data</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
