
CREATE TABLE IF NOT EXISTS sales (
    order_id INTEGER PRIMARY KEY,
    order_date TEXT NOT NULL,
    product TEXT NOT NULL,
    category TEXT NOT NULL,
    region TEXT NOT NULL,
    units INTEGER NOT NULL CHECK (units >= 0),
    unit_price REAL NOT NULL CHECK (unit_price >= 0),
    unit_cost REAL NOT NULL CHECK (unit_cost >= 0),
    discount_pct REAL NOT NULL
        CHECK (discount_pct >= 0 AND discount_pct <= 100),
    revenue REAL,
    gross_profit REAL,
    gross_margin REAL
);
