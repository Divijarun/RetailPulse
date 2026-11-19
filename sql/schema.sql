-- RetailPulse Database Schema
-- Multi-company capable sales intelligence schema

-- 1. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Import Batches Table
CREATE TABLE IF NOT EXISTS import_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL DEFAULT 1,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    total_records INTEGER NOT NULL,
    valid_records INTEGER NOT NULL,
    invalid_records INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'rolled_back')),
    imported_at TEXT DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 3. Sales Table
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    company_id INTEGER NOT NULL DEFAULT 1,
    order_date TEXT NOT NULL,
    product TEXT NOT NULL,
    category TEXT NOT NULL,
    region TEXT NOT NULL,
    units INTEGER NOT NULL CHECK (units >= 0),
    unit_price REAL NOT NULL CHECK (unit_price >= 0),
    unit_cost REAL NOT NULL CHECK (unit_cost >= 0),
    discount_pct REAL NOT NULL CHECK (discount_pct >= 0 AND discount_pct <= 100),
    gross_sales REAL NOT NULL,
    discount_amount REAL NOT NULL,
    revenue REAL NOT NULL,
    cogs REAL NOT NULL,
    gross_profit REAL NOT NULL,
    gross_margin REAL NOT NULL,
    import_batch_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, order_id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (import_batch_id) REFERENCES import_batches(id) ON DELETE SET NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_sales_company ON sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(order_date);
CREATE INDEX IF NOT EXISTS idx_sales_category ON sales(category);
CREATE INDEX IF NOT EXISTS idx_sales_region ON sales(region);
CREATE INDEX IF NOT EXISTS idx_sales_batch ON sales(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_batches_company ON import_batches(company_id);
