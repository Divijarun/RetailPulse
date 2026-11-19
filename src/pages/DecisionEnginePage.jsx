import React, { useState, useEffect } from 'react';
import { runClientDecisionEngine } from '../utils/decisionEngineClient.js';
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  Info,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';

export default function DecisionEnginePage({
  isLive,
  salesRows = [],
  filters,
  onNavigate,
}) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  const fetchInsights = async () => {
    setLoading(true);
    if (!isLive) {
      // In Demo mode, execute client-side decision engine
      const res = runClientDecisionEngine(salesRows);
      setInsights(res);
      setLoading(false);
      return;
    }

    try {
      const q = new URLSearchParams();
      q.set('companyId', '1');
      if (filters.month) q.set('month', filters.month);
      if (filters.category) q.set('category', filters.category);
      if (filters.region) q.set('region', filters.region);

      const resp = await fetch(`/api/decisions?${q.toString()}`);
      if (resp.ok) {
        const data = await resp.json();
        setInsights(data.insights || data.data || []);
      } else {
        // Fallback to client engine
        setInsights(runClientDecisionEngine(salesRows));
      }
    } catch (err) {
      console.warn('API error fetching decisions, using client fallback:', err);
      setInsights(runClientDecisionEngine(salesRows));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [isLive, salesRows, filters.month, filters.category, filters.region]);

  const filteredInsights = insights.filter((item) => {
    if (selectedSeverity === 'all') return true;
    return item.severity === selectedSeverity;
  });

  const counts = {
    all: insights.length,
    critical: insights.filter((i) => i.severity === 'critical').length,
    warning: insights.filter((i) => i.severity === 'warning').length,
    positive: insights.filter((i) => i.severity === 'positive').length,
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="tf-pill tf-pill-critical">
            <ShieldAlert size={12} /> CRITICAL
          </span>
        );
      case 'warning':
        return (
          <span className="tf-pill tf-pill-warning">
            <AlertTriangle size={12} /> WARNING
          </span>
        );
      case 'positive':
        return (
          <span className="tf-pill tf-pill-positive">
            <CheckCircle size={12} /> OPPORTUNITY / STRENGTH
          </span>
        );
      default:
        return (
          <span className="tf-pill tf-pill-info">
            <Info size={12} /> OBSERVATION
          </span>
        );
    }
  };

  return (
    <div className="tf-page-content">
      {/* Header Banner */}
      <div className="tf-engine-header">
        <div className="tf-engine-title-wrap">
          <div className="tf-engine-icon">
            <Brain size={24} />
          </div>
          <div>
            <h2 className="tf-engine-title">Business Decision Engine</h2>
            <p className="tf-engine-subtitle">
              Automated rule-based diagnostic findings generated directly from your transaction ledger.
            </p>
          </div>
        </div>
        <button
          className="tf-btn-ghost tf-btn-sm"
          onClick={fetchInsights}
          disabled={loading}
          title="Re-evaluate all rules"
        >
          <RefreshCw size={14} className={loading ? 'tf-spin' : ''} />
          Re-evaluate
        </button>
      </div>

      {/* Tabs */}
      <div className="tf-toolbar" style={{ marginTop: '16px' }}>
        <div className="tf-tabs">
          <button
            className={`tf-tab ${selectedSeverity === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedSeverity('all')}
          >
            All Findings ({counts.all})
          </button>
          <button
            className={`tf-tab ${selectedSeverity === 'critical' ? 'active' : ''}`}
            onClick={() => setSelectedSeverity('critical')}
          >
            Critical Risks ({counts.critical})
          </button>
          <button
            className={`tf-tab ${selectedSeverity === 'warning' ? 'active' : ''}`}
            onClick={() => setSelectedSeverity('warning')}
          >
            Warnings ({counts.warning})
          </button>
          <button
            className={`tf-tab ${selectedSeverity === 'positive' ? 'active' : ''}`}
            onClick={() => setSelectedSeverity('positive')}
          >
            Positive Signals ({counts.positive})
          </button>
        </div>
      </div>

      {/* List of Insight Cards */}
      <div className="tf-insight-list" style={{ marginTop: '16px' }}>
        {filteredInsights.length === 0 ? (
          <div className="tf-panel" style={{ padding: '36px', textAlign: 'center' }}>
            <p className="tf-text-muted">No findings matching the selected filter.</p>
          </div>
        ) : (
          filteredInsights.map((item) => (
            <div key={item.id} className={`tf-insight-card tf-insight-${item.severity}`}>
              <div className="tf-insight-header">
                <div className="tf-insight-top">
                  {getSeverityBadge(item.severity)}
                  <h4 className="tf-insight-title">{item.title}</h4>
                </div>
              </div>

              <div className="tf-insight-body">
                <div className="tf-insight-section">
                  <div className="tf-insight-heading">OBSERVATION (WHAT HAPPENED)</div>
                  <p className="tf-insight-text">{item.what}</p>
                </div>

                {item.evidence && (
                  <div className="tf-insight-section">
                    <div className="tf-insight-heading">EVIDENCE & DATA POINTS</div>
                    <div className="tf-insight-evidence">{item.evidence}</div>
                  </div>
                )}

                {item.factors && (
                  <div className="tf-insight-section">
                    <div className="tf-insight-heading">POSSIBLE CONTRIBUTING FACTORS</div>
                    <p className="tf-insight-text tf-text-muted">{item.factors}</p>
                  </div>
                )}

                <div className="tf-insight-section tf-insight-action-box">
                  <div className="tf-insight-heading" style={{ color: 'var(--tf-accent)' }}>
                    <Lightbulb size={13} style={{ display: 'inline', marginRight: 4 }} />
                    RECOMMENDED ACTION
                  </div>
                  <p className="tf-insight-action-text">{item.action}</p>
                </div>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="tf-insight-footer">
                  <div className="tf-tags">
                    {item.tags.map((tag) => (
                      <span key={tag} className="tf-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Methodology note */}
      <div className="tf-footer-note" style={{ marginTop: '24px' }}>
        <p>
          ✦ <strong>Methodology Note:</strong> Tradeframe insights are computed strictly from your imported sales
          records using deterministic financial rules. They are diagnostic signals to guide managerial decisions,
          not speculative estimates.
        </p>
      </div>
    </div>
  );
}
