import React from 'react';
import { fmt } from '../utils.js';
import { Printer, Download, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ReportsPage({
  metrics,
  productData = [],
  regionalData = [],
  categoryData = [],
  onExportCSV,
}) {
  const topProducts = (productData || []).slice(0, 5);
  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="tf-page-content">
      {/* Action Bar */}
      <div className="tf-toolbar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} className="tf-text-teal" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
            Executive Decision Dossier
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="tf-btn-ghost tf-btn-sm" onClick={onExportCSV}>
            <Download size={13} />
            Export Data CSV
          </button>
          <button className="tf-btn-primary tf-btn-sm" onClick={handlePrint}>
            <Printer size={13} />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Report Card */}
      <div className="tf-report-sheet" style={{ marginTop: '16px' }}>
        {/* Header */}
        <div className="tf-report-header">
          <div>
            <div className="tf-report-brand">TRADEFRAME</div>
            <div className="tf-report-title">Executive Performance & Decision Briefing</div>
            <div className="tf-report-sub">Retail Business Analytics & Financial Ledger</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="tf-report-meta-label">Generated on</div>
            <div className="tf-report-meta-val">{reportDate}</div>
            <div className="tf-report-meta-label" style={{ marginTop: 6 }}>Scope</div>
            <div className="tf-report-meta-val">Full Catalog / Current Period</div>
          </div>
        </div>

        <div className="tf-report-divider" />

        {/* Section 1: Executive Financial Summary */}
        <div className="tf-report-section">
          <h4 className="tf-report-sec-title">1. Executive Financial Summary</h4>
          <div className="tf-report-kpi-grid">
            <div className="tf-report-kpi">
              <span className="tf-report-kpi-lbl">Total Net Revenue</span>
              <span className="tf-report-kpi-val tf-text-teal">{fmt.money(metrics?.revenue)}</span>
            </div>
            <div className="tf-report-kpi">
              <span className="tf-report-kpi-lbl">Gross Profit</span>
              <span className="tf-report-kpi-val tf-text-green">{fmt.money(metrics?.profit)}</span>
            </div>
            <div className="tf-report-kpi">
              <span className="tf-report-kpi-lbl">Gross Margin</span>
              <span className="tf-report-kpi-val">{metrics?.margin?.toFixed(1) || 0}%</span>
            </div>
            <div className="tf-report-kpi">
              <span className="tf-report-kpi-lbl">Total Volume</span>
              <span className="tf-report-kpi-val">{fmt.num(metrics?.units)} units</span>
            </div>
            <div className="tf-report-kpi">
              <span className="tf-report-kpi-lbl">Avg Order Value</span>
              <span className="tf-report-kpi-val">{fmt.money(metrics?.aov)}</span>
            </div>
            <div className="tf-report-kpi">
              <span className="tf-report-kpi-lbl">Discount Leakage</span>
              <span className="tf-report-kpi-val tf-text-amber">{fmt.money(metrics?.discountAmount)}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Top Products */}
        <div className="tf-report-section" style={{ marginTop: '24px' }}>
          <h4 className="tf-report-sec-title">2. Top 5 Revenue Drivers</h4>
          <table className="tf-table tf-report-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Units</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
                <th style={{ textAlign: 'right' }}>Gross Profit</th>
                <th style={{ textAlign: 'right' }}>Margin %</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.product}>
                  <td className="tf-font-medium">{p.product}</td>
                  <td>{p.category}</td>
                  <td style={{ textAlign: 'right' }}>{fmt.num(p.units)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt.money(p.revenue)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt.money(p.profit)}</td>
                  <td style={{ textAlign: 'right' }}>{p.margin?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Regional Breakdown */}
        <div className="tf-report-section" style={{ marginTop: '24px' }}>
          <h4 className="tf-report-sec-title">3. Regional Territory Breakdown</h4>
          <table className="tf-table tf-report-table">
            <thead>
              <tr>
                <th>Region</th>
                <th style={{ textAlign: 'right' }}>Orders</th>
                <th style={{ textAlign: 'right' }}>Units</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
                <th style={{ textAlign: 'right' }}>Gross Profit</th>
                <th style={{ textAlign: 'right' }}>Margin %</th>
              </tr>
            </thead>
            <tbody>
              {regionalData.map((r) => (
                <tr key={r.region}>
                  <td className="tf-font-medium">{r.region}</td>
                  <td style={{ textAlign: 'right' }}>{r.orders}</td>
                  <td style={{ textAlign: 'right' }}>{fmt.num(r.units)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt.money(r.revenue)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt.money(r.profit)}</td>
                  <td style={{ textAlign: 'right' }}>{r.margin?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="tf-report-footer">
          <div>TRADEFRAME Decision Intelligence • Certified Financial Calculation Engine</div>
          <div>Confidential • For Internal Management Use Only</div>
        </div>
      </div>
    </div>
  );
}
