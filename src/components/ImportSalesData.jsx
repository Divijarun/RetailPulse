import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Database,
  History,
  Trash2,
  ArrowRight,
  Check,
  FileText
} from "lucide-react";
import "./ImportSalesData.css";

const REQUIRED_FIELDS = [
  { key: "order_id", label: "Order ID" },
  { key: "order_date", label: "Order Date" },
  { key: "product", label: "Product" },
  { key: "category", label: "Category" },
  { key: "region", label: "Region" },
  { key: "units", label: "Units" },
  { key: "unit_price", label: "Unit Price" },
  { key: "unit_cost", label: "Unit Cost" },
  { key: "discount_pct", label: "Discount Percentage" },
];

export default function ImportSalesData({ onImportSuccess, onSwitchToDashboard }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Uploaded dataset state
  const [fileMeta, setFileMeta] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [validationResult, setValidationResult] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [allRawRecords, setAllRawRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("preview"); // 'preview', 'errors', 'mapping', 'history'

  // Import options
  const [duplicateMode, setDuplicateMode] = useState("skip"); // 'skip', 'replace', 'error'
  const [batches, setBatches] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  async function fetchBatches() {
    try {
      const res = await fetch("/api/import/batches");
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch (e) {
      console.warn("Could not fetch batches:", e);
    }
  }

  // Handle Drag & Drop
  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  }

  function handleFileInputChange(e) {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  }

  async function handleFileSelected(file) {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "File parsing and upload failed.");
      }

      setFileMeta({
        name: data.fileName,
        size: data.fileSize,
        totalRecords: data.totalRecords,
        columns: data.columns,
        format: data.format,
      });

      setColumnMapping(data.columnMapping || {});
      setValidationResult(data.validationResult);
      setPreviewRows(data.previewRows || []);
      setAllRawRecords(data.validationResult?.validRecords || []);
      setActiveTab(data.validationResult?.invalidCount > 0 ? "errors" : "preview");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMappingChange(fieldKey, selectedColumn) {
    const updatedMapping = { ...columnMapping, [fieldKey]: selectedColumn };
    setColumnMapping(updatedMapping);

    // Revalidate if previewRows exist
    if (fileMeta) {
      setLoading(true);
      try {
        const res = await fetch("/api/import/validate-custom-mapping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            records: previewRows,
            columnMapping: updatedMapping,
            companyId: 1
          }),
        });
        const data = await res.json();
        if (res.ok && data.validationResult) {
          setValidationResult(data.validationResult);
        }
      } catch (e) {
        console.error("Re-validation failed:", e);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleConfirmImport(allowPartial = false) {
    if (!validationResult || !validationResult.validRecords.length) {
      setError("No valid records available to import.");
      return;
    }

    if (!allowPartial && validationResult.invalidCount > 0) {
      setError(`Cannot import: Dataset contains ${validationResult.invalidCount} invalid record(s). Please review errors or choose "Import Valid Records Only".`);
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const payload = {
        fileName: fileMeta.name,
        fileSize: fileMeta.size,
        records: validationResult.validRecords,
        companyId: 1,
        duplicateMode,
        rejectedCount: validationResult.invalidCount
      };

      const res = await fetch("/api/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to commit import into database.");
      }

      setSuccessMessage(`Successfully imported ${data.insertedCount} records (Batch #${data.batchId}) into SQLite database!`);
      fetchBatches();
      if (onImportSuccess) {
        onImportSuccess(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  async function handleLoadSampleFile(filename) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sales/seed-sample`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: 1 })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage("Sample dataset seeded successfully into the SQLite live database!");
        fetchBatches();
        if (onImportSuccess) onImportSuccess();
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetDatabase() {
    if (!window.confirm("Are you sure you want to clear all imported sales records from SQLite?")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/reset?companyId=1`, { method: "DELETE" });
      if (res.ok) {
        setFileMeta(null);
        setValidationResult(null);
        setSuccessMessage("Live database records reset successfully.");
        fetchBatches();
        if (onImportSuccess) onImportSuccess();
      }
    } catch (e) {
      setError("Failed to reset database: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  return (
    <div className="import-container">
      {/* Top Heading */}
      <section className="import-hero">
        <div>
          <div className="eyebrow">DATA MANAGEMENT</div>
          <h1>Import Sales Data<span className="heading-period">.</span></h1>
          <p>Upload CSV or Excel XLSX files with full validation, column mapping, and database transaction protection.</p>
        </div>
        <div className="import-top-actions">
          <button className="btn-secondary" onClick={() => handleLoadSampleFile("sample_seed_data.csv")}>
            <Database size={15} /> Seed Standard Demo Data
          </button>
          <button className="btn-danger" onClick={handleResetDatabase}>
            <Trash2 size={15} /> Reset Live DB
          </button>
        </div>
      </section>

      {/* Global Alerts */}
      {error && (
        <div className="alert-box danger">
          <AlertCircle size={18} />
          <div><strong>Error:</strong> {error}</div>
        </div>
      )}
      {successMessage && (
        <div className="alert-box success">
          <CheckCircle2 size={18} />
          <div style={{ flex: 1 }}>
            <strong>Success:</strong> {successMessage}
          </div>
          {onSwitchToDashboard && (
            <button className="btn-primary" style={{ padding: "6px 12px", fontSize: "11px" }} onClick={onSwitchToDashboard}>
              View in Dashboard <ArrowRight size={13} />
            </button>
          )}
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        className={`upload-dropzone ${dragActive ? "drag-active" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls"
          style={{ display: "none" }}
          onChange={handleFileInputChange}
        />
        <div className="upload-icon-wrap">
          <UploadCloud size={30} />
        </div>
        <div className="upload-title">
          {loading ? "Processing dataset..." : "Drag and drop sales file here, or browse"}
        </div>
        <div className="upload-subtitle">
          Supports CSV and Excel (.xlsx, .xls) files up to 25 MB with automatic schema mapping
        </div>
        <div className="upload-badges">
          <span className="format-pill"><FileSpreadsheet size={13} /> Excel XLSX</span>
          <span className="format-pill"><FileText size={13} /> CSV File</span>
          <span className="format-pill"><Check size={13} /> Transaction Rollback</span>
        </div>

        <div className="quick-samples" onClick={(e) => e.stopPropagation()}>
          <span>Quick test samples from project:</span>
          <button type="button" className="sample-chip" onClick={() => handleLoadSampleFile("sales.csv")}>
            Seed 24 Clean Orders
          </button>
        </div>
      </div>

      {/* Uploaded File Info & Validation Overview */}
      {fileMeta && (
        <>
          <div className="file-meta-card">
            <div className="file-info-group">
              <div className="file-format-icon">
                <FileSpreadsheet size={24} />
              </div>
              <div className="file-details">
                <h3>{fileMeta.name}</h3>
                <p>
                  Size: <b>{formatBytes(fileMeta.size)}</b> · Total Records: <b>{fileMeta.totalRecords}</b> · Format: <b>{fileMeta.format.toUpperCase()}</b>
                </p>
              </div>
            </div>
            <div className="file-actions">
              <button className="btn-secondary" onClick={() => { setFileMeta(null); setValidationResult(null); }}>
                Cancel & Upload New
              </button>
            </div>
          </div>

          {/* Validation KPI Badges */}
          {validationResult && (
            <div className="validation-kpi-grid">
              <div className="val-kpi-card">
                <div className="val-kpi-icon blue"><FileText size={20} /></div>
                <div>
                  <span className="val-kpi-title">Total Records</span>
                  <div className="val-kpi-val">{validationResult.totalRecords}</div>
                </div>
              </div>
              <div className="val-kpi-card">
                <div className="val-kpi-icon green"><CheckCircle2 size={20} /></div>
                <div>
                  <span className="val-kpi-title">Valid Records</span>
                  <div className="val-kpi-val">{validationResult.validCount}</div>
                </div>
              </div>
              <div className="val-kpi-card">
                <div className="val-kpi-icon red"><AlertCircle size={20} /></div>
                <div>
                  <span className="val-kpi-title">Invalid Records</span>
                  <div className="val-kpi-val">{validationResult.invalidCount}</div>
                </div>
              </div>
              <div className="val-kpi-card">
                <div className="val-kpi-icon amber"><AlertTriangle size={20} /></div>
                <div>
                  <span className="val-kpi-title">Duplicates Detected</span>
                  <div className="val-kpi-val">{validationResult.summary?.duplicateCount || 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* Preview / Errors / Mapping Tabs */}
          <div className="mapping-card">
            <div className="preview-tabs">
              <button
                className={`preview-tab ${activeTab === "preview" ? "active" : ""}`}
                onClick={() => setActiveTab("preview")}
              >
                Data Preview ({previewRows.length} rows)
              </button>
              <button
                className={`preview-tab ${activeTab === "mapping" ? "active" : ""}`}
                onClick={() => setActiveTab("mapping")}
              >
                Column Mapping ({Object.keys(columnMapping).length} fields)
              </button>
              {validationResult?.invalidCount > 0 && (
                <button
                  className={`preview-tab ${activeTab === "errors" ? "active" : ""}`}
                  onClick={() => setActiveTab("errors")}
                  style={{ color: "#ef4444" }}
                >
                  Validation Errors ({validationResult.invalidCount})
                </button>
              )}
              <button
                className={`preview-tab ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                Import History ({batches.length})
              </button>
            </div>

            {/* TAB 1: DATA PREVIEW */}
            {activeTab === "preview" && (
              <div style={{ overflowX: "auto" }}>
                <table className="mapping-table">
                  <thead>
                    <tr>
                      <th>ROW</th>
                      <th>ORDER ID</th>
                      <th>DATE</th>
                      <th>PRODUCT</th>
                      <th>CATEGORY</th>
                      <th>REGION</th>
                      <th style={{ textAlign: "right" }}>UNITS</th>
                      <th style={{ textAlign: "right" }}>PRICE</th>
                      <th style={{ textAlign: "right" }}>COST</th>
                      <th style={{ textAlign: "right" }}>DISCOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => {
                      const orderId = row[columnMapping.order_id] || row["Order ID"] || row.id || `#${idx + 1}`;
                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{orderId}</td>
                          <td>{row[columnMapping.order_date] || row["Order Date"] || row.date}</td>
                          <td>{row[columnMapping.product] || row["Product"] || row.product}</td>
                          <td>
                            <span className="format-pill">{row[columnMapping.category] || row["Category"] || row.category}</span>
                          </td>
                          <td>{row[columnMapping.region] || row["Region"] || row.region}</td>
                          <td style={{ textAlign: "right" }}>{row[columnMapping.units] || row["Units"] || row.units}</td>
                          <td style={{ textAlign: "right" }}>₹{row[columnMapping.unit_price] || row["Unit Price"] || row.price}</td>
                          <td style={{ textAlign: "right" }}>₹{row[columnMapping.unit_cost] || row["Unit Cost"] || row.cost}</td>
                          <td style={{ textAlign: "right" }}>{row[columnMapping.discount_pct] || row["Discount Percentage"] || row.discount}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: COLUMN MAPPING */}
            {activeTab === "mapping" && (
              <table className="mapping-table">
                <thead>
                  <tr>
                    <th>REQUIRED TARGET FIELD</th>
                    <th>DETECTED SOURCE COLUMN</th>
                    <th>MAPPING STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {REQUIRED_FIELDS.map((field) => {
                    const currentMatch = columnMapping[field.key] || "";
                    const isMapped = Boolean(currentMatch);

                    return (
                      <tr key={field.key}>
                        <td style={{ fontWeight: 600 }}>{field.label}</td>
                        <td>
                          <select
                            className="mapping-select"
                            value={currentMatch}
                            onChange={(e) => handleMappingChange(field.key, e.target.value)}
                          >
                            <option value="">-- Select Source Column --</option>
                            {fileMeta.columns.map((col) => (
                              <option key={col} value={col}>
                                {col}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {isMapped ? (
                            <span className="mapping-badge-ok">
                              <CheckCircle2 size={14} /> Mapped
                            </span>
                          ) : (
                            <span className="mapping-badge-warn">
                              <AlertCircle size={14} /> Unmapped
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* TAB 3: VALIDATION ERRORS TABLE */}
            {activeTab === "errors" && validationResult?.errors && (
              <div className="errors-panel" style={{ border: "none", borderRadius: 0 }}>
                <div className="errors-header">
                  <h4><AlertCircle size={16} /> Data Validation Issues Detected ({validationResult.errors.length})</h4>
                  <span style={{ fontSize: "11px", color: "#991b1b" }}>Never silently discarding records</span>
                </div>
                <div className="errors-table-wrap">
                  <table className="errors-table">
                    <thead>
                      <tr>
                        <th>ROW #</th>
                        <th>ORDER ID</th>
                        <th>FIELD</th>
                        <th>INVALID VALUE</th>
                        <th>ERROR DESCRIPTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResult.errors.map((err, idx) => (
                        <tr key={idx}>
                          <td><b>#{err.rowNumber}</b></td>
                          <td><code>{err.orderId}</code></td>
                          <td className="err-field">{err.label || err.field}</td>
                          <td>
                            <span className="err-pill">{String(err.value === undefined ? "empty" : err.value)}</span>
                          </td>
                          <td className="err-msg">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: IMPORT BATCH HISTORY */}
            {activeTab === "history" && (
              <div style={{ padding: "0" }}>
                <table className="mapping-table">
                  <thead>
                    <tr>
                      <th>BATCH ID</th>
                      <th>FILE NAME</th>
                      <th>TOTAL RECORDS</th>
                      <th>VALID / INVALID</th>
                      <th>STATUS</th>
                      <th>IMPORTED AT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.length ? batches.map((b) => (
                      <tr key={b.id}>
                        <td><b>#{b.id}</b></td>
                        <td>{b.file_name}</td>
                        <td>{b.total_records}</td>
                        <td>
                          <span style={{ color: "#10b981", fontWeight: 600 }}>{b.valid_records} valid</span> / <span style={{ color: b.invalid_records ? "#ef4444" : "#858ca0" }}>{b.invalid_records} invalid</span>
                        </td>
                        <td>
                          <span className={`batch-badge ${b.status}`}>{b.status.toUpperCase()}</span>
                        </td>
                        <td style={{ fontSize: "11px", color: "#858ca0" }}>{new Date(b.imported_at).toLocaleString()}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" style={{ textAlign: "center", color: "#858ca0" }}>No import batches recorded yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Conflict Resolution & Commit Action Bar */}
          <div className="import-action-bar">
            <div className="conflict-option">
              <span>Duplicate Handling Strategy:</span>
              <select value={duplicateMode} onChange={(e) => setDuplicateMode(e.target.value)}>
                <option value="skip">Skip duplicates (Safe)</option>
                <option value="replace">Update / Replace existing records</option>
                <option value="error">Strict abort on any duplicate</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {validationResult?.invalidCount > 0 ? (
                <>
                  <button
                    className="btn-secondary"
                    disabled={importing || !validationResult?.validCount}
                    onClick={() => handleConfirmImport(true)}
                  >
                    Import Valid Only ({validationResult.validCount} rows) · Reject {validationResult.invalidCount} Invalid
                  </button>
                  <button
                    className="btn-primary"
                    disabled={true}
                    title="Resolve errors first or use 'Import Valid Only'"
                  >
                    Resolve All Errors Before Full Import
                  </button>
                </>
              ) : (
                <button
                  className="btn-primary"
                  disabled={importing || !validationResult?.validCount}
                  onClick={() => handleConfirmImport(false)}
                >
                  {importing ? "Committing Transaction..." : `Confirm & Commit ${validationResult?.validCount || 0} Records`}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Previous Import Batches Card if no file currently uploaded */}
      {!fileMeta && batches.length > 0 && (
        <div className="batch-history-panel">
          <div className="mapping-header">
            <h3><History size={16} /> Import Batch Audit Trail</h3>
            <span style={{ fontSize: "12px", color: "#858ca0" }}>{batches.length} previous imports</span>
          </div>
          <table className="mapping-table">
            <thead>
              <tr>
                <th>BATCH</th>
                <th>FILE</th>
                <th>RECORDS</th>
                <th>VALID / INVALID</th>
                <th>STATUS</th>
                <th>IMPORTED AT</th>
              </tr>
            </thead>
            <tbody>
              {batches.slice(0, 5).map((b) => (
                <tr key={b.id}>
                  <td><b>#{b.id}</b></td>
                  <td>{b.file_name}</td>
                  <td>{b.total_records}</td>
                  <td>
                    <span style={{ color: "#10b981", fontWeight: 600 }}>{b.valid_records} valid</span> / <span style={{ color: b.invalid_records ? "#ef4444" : "#858ca0" }}>{b.invalid_records} rejected</span>
                  </td>
                  <td>
                    <span className={`batch-badge ${b.status}`}>{b.status.toUpperCase()}</span>
                  </td>
                  <td style={{ fontSize: "11px", color: "#858ca0" }}>{new Date(b.imported_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
