import React from 'react';
import ImportSalesData from '../components/ImportSalesData';
import { Database, HardDrive, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function DataManagementPage({
  isLive,
  onImportSuccess,
  onSwitchToDashboard,
  onToggleSource,
}) {
  return (
    <div className="tf-page-content">
      {/* Top Banner on Data Mode */}
      <div className="tf-data-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="tf-data-banner-icon">
            <Database size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#20243a', margin: 0 }}>
                Active Storage Engine: {isLive ? 'SQLite Database (Persistent)' : 'Demo Sandbox (Memory)'}
              </h3>
              <span className={`tf-pill ${isLive ? 'tf-pill-positive' : 'tf-pill-warning'}`}>
                {isLive ? 'LIVE' : 'DEMO MODE'}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#7a8ba0', margin: '4px 0 0 0' }}>
              {isLive
                ? 'All imported batches are recorded with transactional ACID safety in retailpulse.db'
                : 'Currently previewing built-in demonstration records. Switch to Live Database to import your real business files.'}
            </p>
          </div>
        </div>

        {!isLive && (
          <button className="tf-btn-primary tf-btn-sm" onClick={() => onToggleSource('live')}>
            Switch to Live Database
          </button>
        )}
      </div>

      {/* Main Import Component */}
      <div style={{ marginTop: '20px' }}>
        <ImportSalesData
          onImportSuccess={onImportSuccess}
          onSwitchToDashboard={onSwitchToDashboard}
        />
      </div>
    </div>
  );
}
