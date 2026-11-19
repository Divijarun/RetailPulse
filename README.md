# RetailPulse – Dynamic Sales Data Import & Business Analytics System

RetailPulse is a high-performance retail business intelligence platform built with **React + Vite** and powered by a **Node.js / Express / SQLite** backend. It features dynamic sales dataset import (CSV & Excel XLSX), comprehensive validation with column mapping, ACID-compliant database transactions, and pure SQL business aggregations.

---

## 🚀 Key Features

### 1. Dynamic Sales Data Import
- **Supported Formats**: CSV and Excel (`.xlsx`, `.xls`).
- **Drag-and-Drop Interface**: Elegant upload interface with drag states and animations.
- **File Metadata**: Displays file name, file size, record count, detected columns, and data preview.
- **Intelligent Column Mapping**: Auto-detects columns and maps them to canonical schema fields (`order_id`, `order_date`, `product`, `category`, `region`, `units`, `unit_price`, `unit_cost`, `discount_pct`), with manual override dropdowns.

### 2. Robust Data Validation
- **Missing Value Detection**: Identifies empty or null required fields.
- **Duplicate Detection**: Flags duplicate order IDs within the upload batch and against existing company database records.
- **Numerical & Range Validation**:
  - `units`: Non-negative integers (`>= 0`).
  - `unit_price` & `unit_cost`: Non-negative numerical values (`>= 0`).
  - `discount_pct`: Values bounded between `0%` and `100%`.
- **Date Format Parsing**: Validates and normalizes dates (ISO `YYYY-MM-DD`, `DD/MM/YYYY`, and Excel serial dates).
- **Zero Silent Discard**: Every invalid row is logged with its exact row number, field, invalid value, and explanation. Users can review, adjust duplicate strategies, or import valid records only.

### 3. SQLite Database Integration
- **Relational Schema**:
  - `companies`: Multi-tenant foundation with company-level data isolation.
  - `import_batches`: Audit trail of all imports (`file_name`, `file_size`, `total_records`, `valid_records`, `invalid_records`, `status`).
  - `sales`: Transaction records storing original sales inputs, calculated gross sales, discount amount, net revenue, COGS, gross profit, and gross margin.
- **Prepared Statements & Transactions**: All inserts use parameterized statements wrapped inside `db.transaction()` for atomicity and automatic rollback upon errors.

### 4. Financial Calculation Engine
All calculations use standard financial formulas:
- $\text{Gross Sales} = \text{Units} \times \text{Unit Price}$
- $\text{Discount Amount} = \frac{\text{Gross Sales} \times \text{Discount Percentage}}{100}$
- $\text{Net Revenue} = \text{Gross Sales} - \text{Discount Amount}$
- $\text{COGS} = \text{Units} \times \text{Unit Cost}$
- $\text{Gross Profit} = \text{Net Revenue} - \text{COGS}$
- $\text{Gross Margin (\%)} = \left(\frac{\text{Gross Profit}}{\text{Net Revenue}}\right) \times 100$ *(handles zero revenue safely with 0%)*

### 5. Dynamic Dashboard & Dual-Mode Analytics
- **Live Database Mode**: Queries the SQLite database in real-time using SQL aggregations.
- **Demo Mode**: Preserves original synthetic demo dataset for quick walkthroughs and tests.
- **Real-time Recalculation**: Immediately refreshes KPI cards, monthly revenue area charts, category distribution donuts, product profitability rankings, and rule-based business insights upon import.

---

## 🛠️ REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/import` | Uploads CSV or XLSX file; returns metadata, auto-mapping, and validation report. |
| `POST` | `/api/import/validate-custom-mapping` | Re-validates dataset using custom column mappings. |
| `POST` | `/api/import/confirm` | Commits validated records into SQLite inside an atomic transaction. |
| `GET` | `/api/import/batches` | Retrieves audit history of all import batches. |
| `GET` | `/api/sales` | Returns transactions with pagination, sorting, and filter support. |
| `GET` | `/api/sales/companies` | Lists registered companies. |
| `POST` | `/api/sales/seed-sample` | Seeds company database with sample transactions. |
| `DELETE` | `/api/sales/reset` | Resets sales data and import history for a company. |
| `GET` | `/api/analytics/overview` | Aggregated business KPIs (Revenue, Profit, Margin, Units, Orders). |
| `GET` | `/api/analytics/revenue` | Monthly revenue, COGS, profit, and margin trends. |
| `GET` | `/api/analytics/categories` | Performance breakdown by product category. |
| `GET` | `/api/analytics/products` | Product profitability rankings. |
| `GET` | `/api/analytics/regions` | Regional sales and profit breakdown. |
| `GET` | `/api/analytics/filters` | Distinct filter dropdown values from database. |
| `GET` | `/api/analytics/insights` | Recalculated rule-based business observations. |
| `GET` | `/api/health` | Healthcheck and database connectivity status. |

---

## 🧪 Testing

RetailPulse comes with an automated test suite verifying all 10 core system requirements:

```bash
npm test
```

### Verified Test Cases:
1. Valid CSV import & column mapping.
2. Valid Excel XLSX import.
3. Column mapping with differing header names.
4. Validation error trapping (missing values, invalid dates, negative quantities, negative costs, excess discounts, NaN numbers, duplicates).
5. Empty file & invalid file format rejection.
6. Database insertion & automatic transaction rollback on failure.
7. SQL business calculations & aggregation accuracy.

---

## 🏃 Setup and Execution Instructions

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **npm**: v9+

### 2. Start the Backend API Server
```bash
npm run server
```
Server runs at `http://localhost:5000`.

### 3. Start the Frontend Development Server
In a separate terminal:
```bash
npm run dev
```
Frontend runs at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
Generates production build in `dist/`.
