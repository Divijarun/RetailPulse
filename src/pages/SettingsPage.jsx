import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Building,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Server,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export default function SettingsPage({
  isLive,
  onToggleSource,
  onRefresh,
}) {
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);

  const fetchBatches = async () => {
    if (!isLive) return;
    setLoadingBatches(true);
    try {
      const resp = await fetch('/api/import/batches');
      if (resp.ok) {
        const data = await resp.json();
        setBatches(data.batches || []);
      }
    } catch (err) {
      console.warn('Error fetching batches:', err);
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [isLive]);

  const handleSeedSample = async () => {
    if (!window.confirm('Seed sample dataset into database?')) return;
    try {
      const resp = await fetch('/api/sales/seed-sample', { method: 'POST' });
      if (resp.ok) {
        setActionStatus({ type: 'success', msg: 'Sample dataset seeded successfully into SQLite.' });
        fetchBatches();
        onRefresh();
      } else {
        setActionStatus({ type: 'error', msg: 'Failed to seed sample dataset.' });
      }
    } catch (err) {
      setActionStatus({ type: 'error', msg: err.message });
    }
  };

  const handleResetDb = async () => {
    if (!window.confirm('⚠️ WARNING: This will delete ALL imported sales data from the SQLite database. Continue?')) {
      return;
    }
    try {
      const resp = await fetch('/api/sales/reset', { method: 'DELETE' });
      if (resp.ok) {
        setActionStatus({ type: 'success', msg: 'All sales records and batches purged successfully.' });
        fetchBatches();
        onRefresh();
      } else {
        setActionStatus({ type: 'error', msg: 'Failed to reset database.' });
      }
    } catch (err) {
      setActionStatus({ type: 'error', msg: err.message });
    }
  };

  return (
    <div className="tf-page-content">
      {actionStatus && (
        <div
          className={`tf-alert ${actionStatus.type === 'success' ? 'tf-alert-positive' : 'tf-alert-critical'}`}
          style={{ marginBottom: '16px' }}
        >
          {actionStatus.type === 'success' ? <CheckCircle2 size={16} /> : <Trash2 size={16} />}
          <div>{actionStatus.msg}</div>
        </div>
      )}

      <div className="tf-grid-2col">
        {/* Company & Organization Panel */}
        <div className="tf-panel">
          <div className="tf-panel-header">
            <div>
              <h3 className="tf-panel-title">Organization Profile</h3>
              <p className="tf-panel-desc">Tenant details & business identity</p>
            </div>
            <Building size={16} className="tf-text-teal" />
          </div>
          <div className="tf-panel-body">
            <div className="tf-setting-row">
              <div>
                <div className="tf-setting-title">Organization Name</div>
                <div className="tf-setting-desc">Primary legal retail operating entity</div>
              </div>
              <span className="tf-font-medium" style={{ color: '#20243a' }}>
                TRADEFRAME Primary Store
              </span>
            </div>

            <div className="tf-setting-row">
              <div>
                <div className="tf-setting-title">Tenant Code</div>
                <div className="tf-setting-desc">System routing identifier</div>
              </div>
              <span className="tf-mono">TF-MAIN (Company ID: 1)</span>
            </div>

            <div className="tf-setting-row">
              <div>
                <div className="tf-setting-title">Currency Standard</div>
                <div className="tf-setting-desc">Financial reporting denomination</div>
              </div>
              <span className="tf-pill tf-pill-muted">INR (₹)</span>
            </div>
          </div>
        </div>

        {/* Storage Engine Status */}
        <div className="tf-panel">
          <div className="tf-panel-header">
            <div>
              <h3 className="tf-panel-title">Data Source Configuration</h3>
              <p className="tf-panel-desc">Toggle between live database and sandbox</p>
            </div>
            <Database size={16} className="tf-text-teal" />
          </div>
          <div className="tf-panel-body">
            <div className="tf-setting-row">
              <div>
                <div className="tf-setting-title">Active Data Source</div>
                <div className="tf-setting-desc">
                  {isLive
                    ? 'Connected to SQLite database file on disk.'
                    : 'Using client-side sample ledger for evaluation.'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`tf-btn-sm ${!isLive ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
                  onClick={() => onToggleSource('demo')}
                >
                  Demo Mode
                </button>
                <button
                  className={`tf-btn-sm ${isLive ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
                  onClick={() => onToggleSource('live')}
                >
                  Live Database
                </button>
              </div>
            </div>

            <div className="tf-setting-row">
              <div>
                <div className="tf-setting-title">Seed Demo Data</div>
                <div className="tf-setting-desc">Insert standard 24 baseline transactions</div>
              </div>
              <button className="tf-btn-ghost tf-btn-sm" onClick={handleSeedSample}>
                <RotateCcw size={13} />
                Seed SQLite
              </button>
            </div>

            <div className="tf-setting-row" style={{ borderBottom: 'none' }}>
              <div>
                <div className="tf-setting-title tf-text-red">Purge All Records</div>
                <div className="tf-setting-desc">Reset SQLite database to empty state</div>
              </div>
              <button className="tf-btn-danger tf-btn-sm" onClick={handleResetDb}>
                <Trash2 size={13} />
                Reset Database
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Database Import Batches Log */}
      <div className="tf-panel" style={{ marginTop: '20px' }}>
        <div className="tf-panel-header">
          <div>
            <h3 className="tf-panel-title">Audit Trail: Import Batches</h3>
            <p className="tf-panel-desc">All historical file ingestion sessions tracked in SQLite</p>
          </div>
          {isLive && (
            <button className="tf-btn-ghost tf-btn-sm" onClick={fetchBatches}>
              Refresh Audit Log
            </button>
          )}
        </div>
        <div className="tf-panel-body" style={{ padding: 0 }}>
          <div className="tf-table-wrap">
            <table className="tf-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>File Name</th>
                  <th>File Size</th>
                  <th style={{ textAlign: 'right' }}>Total Rows</th>
                  <th style={{ textAlign: 'right' }}>Valid Rows</th>
                  <th style={{ textAlign: 'right' }}>Errors</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {!isLive ? (
                  <tr>
                    <td colSpan="8" className="tf-table-empty">
                      Audit history is available when Live SQLite Database is active.
                    </td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="tf-table-empty">
                      No import batches recorded yet.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b.id}>
                      <td className="tf-mono">BATCH-{b.id}</td>
                      <td className="tf-font-medium">{b.file_name}</td>
                      <td className="tf-text-muted">{b.file_size ? `${Math.round(b.file_size / 1024)} KB` : '—'}</td>
                      <td style={{ textAlign: 'right' }}>{b.total_records}</td>
                      <td style={{ textAlign: 'right' }} className="tf-text-green">
                        {b.valid_records}
                      </td>
                      <td style={{ textAlign: 'right' }} className={b.error_records > 0 ? 'tf-text-red' : ''}>
                        {b.error_records}
                      </td>
                      <td>
                        <span className={`tf-pill ${b.status === 'completed' ? 'tf-pill-positive' : 'tf-pill-warning'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="tf-text-muted">{b.created_at}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* System Technical Specifications */}
      <div className="tf-panel" style={{ marginTop: '20px' }}>
        <div className="tf-panel-header">
          <div>
            <h3 className="tf-panel-title">System Architecture Specifications</h3>
            <p className="tf-panel-desc">Underlying technology stack parameters</p>
          </div>
          <Server size={16} className="tf-text-muted" />
        </div>
        <div className="tf-panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <span className="tf-text-muted" style={{ fontSize: '11px', display: 'block' }}>ENGINE</span>
              <span className="tf-font-medium" style={{ color: '#20243a' }}>React 19 + Vite 8</span>
            </div>
            <div>
              <span className="tf-text-muted" style={{ fontSize: '11px', display: 'block' }}>BACKEND RUNTIME</span>
              <span className="tf-font-medium" style={{ color: '#20243a' }}>Node.js 24 + Express 5</span>
            </div>
            <div>
              <span className="tf-text-muted" style={{ fontSize: '11px', display: 'block' }}>PERSISTENCE</span>
              <span className="tf-font-medium" style={{ color: '#20243a' }}>SQLite3 (better-sqlite3, WAL mode)</span>
            </div>
            <div>
              <span className="tf-text-muted" style={{ fontSize: '11px', display: 'block' }}>FILE PARSING</span>
              <span className="tf-font-medium" style={{ color: '#20243a' }}>PapaParse / csv-parse + XLSX (Excel)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
