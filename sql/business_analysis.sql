
-- 1. Overall business performance
SELECT
    COUNT(*) AS total_orders,
    SUM(units) AS units_sold,
    ROUND(SUM(revenue), 2) AS total_revenue,
    ROUND(SUM(gross_profit), 2) AS total_gross_profit,
    ROUND(
        100.0 * SUM(gross_profit) / NULLIF(SUM(revenue), 0),
        2
    ) AS overall_gross_margin_pct
FROM sales;


-- 2. Monthly revenue and profit
SELECT
    strftime('%Y-%m', order_date) AS sales_month,
    ROUND(SUM(revenue), 2) AS revenue,
    ROUND(SUM(gross_profit), 2) AS gross_profit,
    ROUND(
        100.0 * SUM(gross_profit) / NULLIF(SUM(revenue), 0),
        2
    ) AS gross_margin_pct
FROM sales
GROUP BY strftime('%Y-%m', order_date)
ORDER BY sales_month;


-- 3. Category performance
SELECT
    category,
    ROUND(SUM(revenue), 2) AS revenue,
    ROUND(SUM(gross_profit), 2) AS gross_profit,
    ROUND(
        100.0 * SUM(gross_profit) / NULLIF(SUM(revenue), 0),
        2
    ) AS gross_margin_pct
FROM sales
GROUP BY category
ORDER BY revenue DESC;


-- 4. Regional performance
SELECT
    region,
    ROUND(SUM(revenue), 2) AS revenue,
    ROUND(SUM(gross_profit), 2) AS gross_profit
FROM sales
GROUP BY region
ORDER BY revenue DESC;


-- 5. Most profitable products
SELECT
    product,
    SUM(units) AS units_sold,
    ROUND(SUM(revenue), 2) AS revenue,
    ROUND(SUM(gross_profit), 2) AS gross_profit
FROM sales
GROUP BY product
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
        100.0 * SUM(gross_profit) / NULLIF(SUM(revenue), 0),
        2
    ) AS gross_margin_pct
FROM sales
GROUP BY discount_band
ORDER BY MIN(discount_pct);


-- 7. Find loss-making order lines
SELECT
    order_id,
    product,
    region,
    revenue,
    gross_profit,
    gross_margin
FROM sales
WHERE gross_profit < 0
ORDER BY gross_profit ASC;
