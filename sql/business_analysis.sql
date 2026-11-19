-- RetailPulse Business Analysis SQL Queries
-- Aggregations and analytical views parameterized for company isolation

-- 1. Overall business performance
SELECT
    COUNT(*) AS total_orders,
    COALESCE(SUM(units), 0) AS units_sold,
    ROUND(COALESCE(SUM(gross_sales), 0), 2) AS total_gross_sales,
    ROUND(COALESCE(SUM(discount_amount), 0), 2) AS total_discount_amount,
    ROUND(COALESCE(SUM(revenue), 0), 2) AS total_revenue,
    ROUND(COALESCE(SUM(cogs), 0), 2) AS total_cogs,
    ROUND(COALESCE(SUM(gross_profit), 0), 2) AS total_gross_profit,
    ROUND(
        CASE 
            WHEN COALESCE(SUM(revenue), 0) = 0 THEN 0.0
            ELSE 100.0 * SUM(gross_profit) / SUM(revenue)
        END,
        2
    ) AS overall_gross_margin_pct,
    ROUND(COALESCE(AVG(discount_pct), 0), 2) AS avg_discount_pct
FROM sales
WHERE company_id = ?;


-- 2. Monthly revenue and profit
SELECT
    strftime('%Y-%m', order_date) AS sales_month,
    ROUND(SUM(gross_sales), 2) AS gross_sales,
    ROUND(SUM(revenue), 2) AS revenue,
    ROUND(SUM(cogs), 2) AS cogs,
    ROUND(SUM(gross_profit), 2) AS gross_profit,
    ROUND(
        CASE 
            WHEN SUM(revenue) = 0 THEN 0.0
            ELSE 100.0 * SUM(gross_profit) / SUM(revenue)
        END,
        2
    ) AS gross_margin_pct,
    SUM(units) AS units_sold,
    COUNT(*) AS orders_count
FROM sales
WHERE company_id = ?
GROUP BY strftime('%Y-%m', order_date)
ORDER BY sales_month ASC;


-- 3. Category performance
SELECT
    category,
    COUNT(*) AS order_count,
    SUM(units) AS units_sold,
    ROUND(SUM(gross_sales), 2) AS gross_sales,
    ROUND(SUM(revenue), 2) AS revenue,
    ROUND(SUM(gross_profit), 2) AS gross_profit,
    ROUND(
        CASE 
            WHEN SUM(revenue) = 0 THEN 0.0
            ELSE 100.0 * SUM(gross_profit) / SUM(revenue)
        END,
        2
    ) AS gross_margin_pct
FROM sales
WHERE company_id = ?
GROUP BY category
ORDER BY revenue DESC;


-- 4. Regional performance
SELECT
    region,
    COUNT(*) AS order_count,
    SUM(units) AS units_sold,
    ROUND(SUM(gross_sales), 2) AS gross_sales,
    ROUND(SUM(revenue), 2) AS revenue,
    ROUND(SUM(gross_profit), 2) AS gross_profit,
    ROUND(
        CASE 
            WHEN SUM(revenue) = 0 THEN 0.0
            ELSE 100.0 * SUM(gross_profit) / SUM(revenue)
        END,
        2
    ) AS gross_margin_pct
FROM sales
WHERE region IS NOT NULL AND company_id = ?
GROUP BY region
ORDER BY revenue DESC;


-- 5. Product performance (Ranked by gross profit contribution)
SELECT
    product,
    category,
    SUM(units) AS units_sold,
    ROUND(SUM(gross_sales), 2) AS gross_sales,
    ROUND(SUM(revenue), 2) AS revenue,
    ROUND(SUM(cogs), 2) AS cogs,
    ROUND(SUM(gross_profit), 2) AS gross_profit,
    ROUND(
        CASE 
            WHEN SUM(revenue) = 0 THEN 0.0
            ELSE 100.0 * SUM(gross_profit) / SUM(revenue)
        END,
        2
    ) AS gross_margin_pct
FROM sales
WHERE company_id = ?
GROUP BY product, category
ORDER BY gross_profit DESC;


-- 6. Discount impact
SELECT
    CASE
        WHEN discount_pct = 0 THEN 'No discount'
        WHEN discount_pct <= 10 THEN '1-10%'
        WHEN discount_pct <= 20 THEN '11-20%'
        ELSE 'Above 20%'
    END AS discount_band,
    COUNT(*) AS order_lines,
    ROUND(SUM(revenue), 2) AS revenue,
    ROUND(SUM(gross_profit), 2) AS gross_profit,
    ROUND(
        CASE 
            WHEN SUM(revenue) = 0 THEN 0.0
            ELSE 100.0 * SUM(gross_profit) / SUM(revenue)
        END,
        2
    ) AS gross_margin_pct
FROM sales
WHERE company_id = ?
GROUP BY discount_band
ORDER BY MIN(discount_pct);


-- 7. Find loss-making order lines
SELECT
    order_id,
    order_date,
    product,
    region,
    revenue,
    cogs,
    gross_profit,
    gross_margin
FROM sales
WHERE gross_profit < 0 AND company_id = ?
ORDER BY gross_profit ASC;
