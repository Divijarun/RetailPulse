import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseUploadedFile } from '../server/services/parser.js';
import { autoMapColumns, validateDataset, REQUIRED_FIELDS } from '../server/services/validator.js';
import { calculateFinancials } from '../server/services/calculator.js';
import { db } from '../server/db.js';
import {
  getOverviewMetrics,
  getRevenueMonthly,
  getCategoryAnalytics,
  getProductAnalytics,
  getRegionalAnalytics
} from '../server/services/analytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    testsFailed++;
  }
}

async function runAllTests() {
  console.log('====================================================');
  console.log('RETAILPULSE COMPREHENSIVE BACKEND & IMPORT TEST SUITE');
  console.log('====================================================\n');

  // Clear test DB state for company 99
  const testCompanyId = 99;
  db.prepare("INSERT OR IGNORE INTO companies (id, name, code) VALUES (99, 'Test Retailer Corp', 'TEST-99')").run();
  db.prepare('DELETE FROM sales WHERE company_id = ?').run(testCompanyId);
  db.prepare('DELETE FROM import_batches WHERE company_id = ?').run(testCompanyId);

  // 1. Financial Calculation Verification
  console.log('--- Test Suite 1: Financial Calculation Formulas ---');
  {
    // Units: 10, Price: 100, Cost: 60, Discount: 10%
    // Gross = 10 * 100 = 1000
    // Discount Amount = 1000 * 0.10 = 100
    // Net Revenue = 1000 - 100 = 900
    // COGS = 10 * 60 = 600
    // Profit = 900 - 600 = 300
    // Margin = (300 / 900) * 100 = 33.33%
    const res = calculateFinancials({ units: 10, unitPrice: 100, unitCost: 60, discountPct: 10 });
    assert(res.grossSales === 1000, 'Gross Sales = Units × Price (1000)');
    assert(res.discountAmount === 100, 'Discount Amount = Gross Sales × Discount / 100 (100)');
    assert(res.revenue === 900, 'Net Revenue = Gross Sales − Discount (900)');
    assert(res.cogs === 600, 'COGS = Units × Cost (600)');
    assert(res.grossProfit === 300, 'Gross Profit = Net Revenue − COGS (300)');
    assert(res.grossMargin === 33.33, 'Gross Margin = (Profit / Revenue) × 100 (33.33%)');

    // Zero revenue edge case
    const zeroRes = calculateFinancials({ units: 0, unitPrice: 100, unitCost: 50, discountPct: 0 });
    assert(zeroRes.grossMargin === 0, 'Zero revenue safely handled with 0% margin');
  }

  // 2. Valid CSV Import & Column Mapping
  console.log('\n--- Test Suite 2: Valid CSV Import & Parsing ---');
  {
    const csvBuffer = fs.readFileSync(path.resolve(__dirname, '../data/sales.csv'));
    const parsed = parseUploadedFile(csvBuffer, 'sales.csv', 'text/csv');
    assert(parsed.format === 'csv', 'CSV format detected');
    assert(parsed.totalRows === 24, `Parsed 24 rows from sales.csv (got ${parsed.totalRows})`);
    
    const mapping = autoMapColumns(parsed.columns);
    const unmapped = REQUIRED_FIELDS.filter(f => !mapping[f.key]);
    assert(unmapped.length === 0, 'All 9 required columns auto-mapped accurately');

    const validation = validateDataset(parsed.records, mapping, testCompanyId);
    assert(validation.validCount === 24, `All 24 sample records valid (got ${validation.validCount})`);
    assert(validation.invalidCount === 0, 'No invalid records in standard dataset');
  }

  // 3. Valid Excel Import (.xlsx)
  console.log('\n--- Test Suite 3: Valid Excel XLSX Import ---');
  {
    const xlsxBuffer = fs.readFileSync(path.resolve(__dirname, '../data/sample_sales.xlsx'));
    const parsed = parseUploadedFile(xlsxBuffer, 'sample_sales.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    assert(parsed.format === 'excel', 'Excel XLSX format detected');
    assert(parsed.totalRows === 24, `Parsed 24 rows from Excel file (got ${parsed.totalRows})`);

    const mapping = autoMapColumns(parsed.columns);
    const validation = validateDataset(parsed.records, mapping, testCompanyId);
    assert(validation.validCount === 24, 'All 24 Excel records validated');
  }

  // 4. Column Mapping with Differing Header Names
  console.log('\n--- Test Suite 4: Column Mapping with Different Header Names ---');
  {
    const diffBuffer = fs.readFileSync(path.resolve(__dirname, '../data/diff_headers.csv'));
    const parsed = parseUploadedFile(diffBuffer, 'diff_headers.csv', 'text/csv');
    const mapping = autoMapColumns(parsed.columns);
    assert(mapping.order_id === 'Order No', 'Order No mapped to order_id');
    assert(mapping.order_date === 'Date', 'Date mapped to order_date');
    assert(mapping.product === 'Item Name', 'Item Name mapped to product');
    assert(mapping.category === 'Department', 'Department mapped to category');
    assert(mapping.region === 'Territory', 'Territory mapped to region');
    assert(mapping.units === 'Quantity', 'Quantity mapped to units');
    assert(mapping.unit_price === 'Selling Price', 'Selling Price mapped to unit_price');
    assert(mapping.unit_cost === 'Item Cost', 'Item Cost mapped to unit_cost');
    assert(mapping.discount_pct === 'Discount Rate', 'Discount Rate mapped to discount_pct');
  }

  // 5. Validation Rules: Missing, Invalid Numbers, Negative, Dates, Duplicates
  console.log('\n--- Test Suite 5: Data Validation Error Trapping ---');
  {
    const errBuffer = fs.readFileSync(path.resolve(__dirname, '../data/test_with_errors.csv'));
    const parsed = parseUploadedFile(errBuffer, 'test_with_errors.csv', 'text/csv');
    const mapping = autoMapColumns(parsed.columns);
    const validation = validateDataset(parsed.records, mapping, testCompanyId);

    assert(validation.validCount === 1, `Only 1 record should be valid (got ${validation.validCount})`);
    assert(validation.invalidCount === 7, `7 invalid records trapped (got ${validation.invalidCount})`);
    
    // Check specific error types
    const errors = validation.errors;
    const hasMissingOrderId = errors.some(e => e.field === 'order_id' && e.message.includes('required'));
    assert(hasMissingOrderId, 'Missing Order ID detected');

    const hasBadDate = errors.some(e => e.field === 'order_date' && e.message.includes('Invalid date format'));
    assert(hasBadDate, 'Invalid Date detected');

    const hasNegUnits = errors.some(e => e.field === 'units' && e.message.includes('cannot be negative'));
    assert(hasNegUnits, 'Negative Units detected');

    const hasNegCost = errors.some(e => e.field === 'unit_cost' && e.message.includes('cannot be negative'));
    assert(hasNegCost, 'Negative Cost detected');

    const hasExcessDiscount = errors.some(e => e.field === 'discount_pct' && e.message.includes('between 0 and 100'));
    assert(hasExcessDiscount, 'Excess Discount (>100%) detected');

    const hasNaNPrice = errors.some(e => e.field === 'unit_price' && e.message.includes('must be a valid number'));
    assert(hasNaNPrice, 'Invalid Number for Price detected');

    const hasDuplicate = errors.some(e => e.field === 'order_id' && e.message.includes('Duplicate Order ID'));
    assert(hasDuplicate, 'Duplicate Order ID in batch detected');
  }

  // 6. Empty File & Invalid File Format Tests
  console.log('\n--- Test Suite 6: Edge Cases: Empty & Invalid Formats ---');
  {
    let emptyCaught = false;
    try {
      parseUploadedFile(Buffer.from(''), 'empty.csv', 'text/csv');
    } catch (e) {
      emptyCaught = true;
    }
    assert(emptyCaught, 'Empty file gracefully rejected with clear message');

    let invalidExtCaught = false;
    try {
      parseUploadedFile(Buffer.from('some text'), 'document.pdf', 'application/pdf');
    } catch (e) {
      invalidExtCaught = true;
    }
    assert(invalidExtCaught, 'Invalid file format (.pdf) rejected');
  }

  // 7. Database Transaction Insertion and Rollback
  console.log('\n--- Test Suite 7: Database Insertion & Transaction Rollback ---');
  {
    // First, insert 24 valid records into test company
    const csvBuffer = fs.readFileSync(path.resolve(__dirname, '../data/sales.csv'));
    const parsed = parseUploadedFile(csvBuffer, 'sales.csv', 'text/csv');
    const mapping = autoMapColumns(parsed.columns);
    const validation = validateDataset(parsed.records, mapping, testCompanyId);

    // Insert batch record
    const batchRow = db.prepare(`
      INSERT INTO import_batches (company_id, file_name, file_size, total_records, valid_records, invalid_records, status)
      VALUES (?, 'sales.csv', 1024, 24, 24, 0, 'pending')
    `).run(testCompanyId);
    const batchId = batchRow.lastInsertRowid;

    // Prepared statement insertion
    const insertStmt = db.prepare(`
      INSERT INTO sales (
        order_id, company_id, order_date, product, category, region,
        units, unit_price, unit_cost, discount_pct, gross_sales, discount_amount,
        revenue, cogs, gross_profit, gross_margin, import_batch_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertTx = db.transaction((rows) => {
      for (const r of rows) {
        insertStmt.run(
          r.order_id, testCompanyId, r.order_date, r.product, r.category, r.region,
          r.units, r.unit_price, r.unit_cost, r.discount_pct, r.grossSales, r.discountAmount,
          r.revenue, r.cogs, r.grossProfit, r.grossMargin, batchId
        );
      }
      db.prepare("UPDATE import_batches SET status = 'completed' WHERE id = ?").run(batchId);
    });

    insertTx(validation.validRecords);

    const countAfter = db.prepare('SELECT COUNT(*) as count FROM sales WHERE company_id = ?').get(testCompanyId);
    assert(countAfter.count === 24, '24 records inserted into sales table within transaction');

    // Test Rollback: attempting to insert conflicting duplicate in strict mode
    let rollbackHappened = false;
    const failingTx = db.transaction(() => {
      insertStmt.run('ORD-FAIL-1', testCompanyId, '2026-01-01', 'Test', 'Misc', 'North', 1, 10, 5, 0, 10, 0, 10, 5, 5, 50, batchId);
      // Intentional duplicate of existing ORD-1001 will violate UNIQUE(company_id, order_id)
      insertStmt.run('ORD-1001', testCompanyId, '2026-01-01', 'Dup', 'Misc', 'North', 1, 10, 5, 0, 10, 0, 10, 5, 5, 50, batchId);
    });

    try {
      failingTx();
    } catch (e) {
      rollbackHappened = true;
    }

    assert(rollbackHappened, 'Transaction threw error on constraint violation');
    const checkFailedRollback = db.prepare("SELECT * FROM sales WHERE order_id = 'ORD-FAIL-1'").get();
    assert(!checkFailedRollback, 'Rollback confirmed: ORD-FAIL-1 was NOT persisted');
  }

  // 8. SQL Analytics Aggregation Accuracy
  console.log('\n--- Test Suite 8: SQL Aggregation Accuracy ---');
  {
    const overview = getOverviewMetrics(testCompanyId);
    assert(overview.orders === 24, `Overview total orders: ${overview.orders} (expected 24)`);
    assert(overview.units === 494, `Overview total units: ${overview.units} (expected 494)`);
    assert(overview.revenue > 0, `Total Revenue aggregated: ₹${overview.revenue}`);
    assert(overview.profit > 0, `Total Gross Profit aggregated: ₹${overview.profit}`);
    assert(overview.margin > 0, `Overall Gross Margin: ${overview.margin}%`);

    const monthly = getRevenueMonthly(testCompanyId);
    assert(monthly.length === 6, `Monthly revenue groups: ${monthly.length} months (Jan to Jun)`);

    const categories = getCategoryAnalytics(testCompanyId);
    assert(categories.length === 3, `Categories count: ${categories.length} (Electronics, Furniture, Stationery)`);
    const totalCatRevenue = Number(categories.reduce((s, c) => s + c.revenue, 0).toFixed(2));
    assert(Math.abs(totalCatRevenue - overview.revenue) < 0.1, `Sum of category revenue (${totalCatRevenue}) matches total revenue (${overview.revenue})`);

    const products = getProductAnalytics(testCompanyId);
    assert(products.length === 8, `Product count: ${products.length} distinct products (expected 8)`);
    assert(products[0].profit >= products[1].profit, 'Products properly sorted by profit descending');

    const regions = getRegionalAnalytics(testCompanyId);
    assert(regions.length === 4, `Regions count: ${regions.length} (North, South, East, West)`);
  }

  // Clean up test company
  db.prepare('DELETE FROM sales WHERE company_id = ?').run(testCompanyId);
  db.prepare('DELETE FROM import_batches WHERE company_id = ?').run(testCompanyId);
  db.prepare('DELETE FROM companies WHERE id = ?').run(testCompanyId);

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('====================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
