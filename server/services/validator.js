import { db } from '../db.js';
import { calculateFinancials } from './calculator.js';

// Canonical required fields
export const REQUIRED_FIELDS = [
  { key: 'order_id', label: 'Order ID', type: 'string' },
  { key: 'order_date', label: 'Order Date', type: 'date' },
  { key: 'product', label: 'Product', type: 'string' },
  { key: 'category', label: 'Category', type: 'string' },
  { key: 'region', label: 'Region', type: 'string' },
  { key: 'units', label: 'Units', type: 'number' },
  { key: 'unit_price', label: 'Unit Price', type: 'number' },
  { key: 'unit_cost', label: 'Unit Cost', type: 'number' },
  { key: 'discount_pct', label: 'Discount Percentage', type: 'number' },
];

// Column aliases for intelligent auto-mapping
export const FIELD_ALIASES = {
  order_id: [
    'order id', 'order_id', 'orderid', 'order no', 'order number',
    'id', 'transaction id', 'invoice id', 'trans_id', 'sales id'
  ],
  order_date: [
    'order date', 'order_date', 'orderdate', 'date', 'transaction date',
    'sale date', 'invoice date', 'trans_date'
  ],
  product: [
    'product', 'product name', 'product_name', 'item', 'item name',
    'item_name', 'sku', 'product title', 'description'
  ],
  category: [
    'category', 'category name', 'category_name', 'product category',
    'dept', 'department', 'segment', 'type'
  ],
  region: [
    'region', 'region name', 'territory', 'zone', 'location',
    'market', 'area', 'country region'
  ],
  units: [
    'units', 'quantity', 'qty', 'units sold', 'units_sold',
    'volume', 'count', 'pieces', 'items'
  ],
  unit_price: [
    'unit price', 'unit_price', 'unitprice', 'price', 'selling price',
    'selling_price', 'price per unit', 'unit price (inr)', 'retail price'
  ],
  unit_cost: [
    'unit cost', 'unit_cost', 'unitcost', 'cost', 'item cost',
    'cost per unit', 'unit cost (inr)', 'cogs unit'
  ],
  discount_pct: [
    'discount percentage', 'discount pct', 'discount_pct', 'discount',
    'discount %', 'discount percentage (%)', 'discount rate', 'discount_rate',
    'discount (%)'
  ]
};

/**
 * Automatically maps uploaded file column names to canonical schema keys
 */
export function autoMapColumns(columns) {
  const mapping = {};
  const normalizedColumns = columns.map(col => ({
    original: col,
    clean: col.trim().toLowerCase().replace(/[\s_-]+/g, ' ')
  }));

  for (const field of REQUIRED_FIELDS) {
    const aliases = FIELD_ALIASES[field.key] || [];
    let matchedColumn = null;

    // 1. Direct match with alias
    for (const alias of aliases) {
      const match = normalizedColumns.find(c => c.clean === alias || c.clean.includes(alias));
      if (match) {
        matchedColumn = match.original;
        break;
      }
    }

    // 2. Fallback key match
    if (!matchedColumn) {
      const keyClean = field.key.replace('_', ' ');
      const match = normalizedColumns.find(c => c.clean === keyClean);
      if (match) matchedColumn = match.original;
    }

    mapping[field.key] = matchedColumn || '';
  }

  return mapping;
}

/**
 * Standardize dates into YYYY-MM-DD
 */
export function parseDate(rawDate) {
  if (rawDate === null || rawDate === undefined || rawDate === '') {
    return { valid: false, formatted: null, raw: rawDate };
  }

  // Handle numbers from Excel (serial dates)
  if (typeof rawDate === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + rawDate * 86400000);
    if (!isNaN(date.getTime())) {
      return {
        valid: true,
        formatted: date.toISOString().slice(0, 10),
        raw: rawDate
      };
    }
  }

  const str = String(rawDate).trim();
  
  // Try direct regex matches
  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parts = str.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (d.getFullYear() === parts[0] && d.getMonth() === parts[1] - 1 && d.getDate() === parts[2]) {
      return { valid: true, formatted: str, raw: rawDate };
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
      const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { valid: true, formatted, raw: rawDate };
    }
  }

  // Generic Date parsing fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
    const formatted = parsed.toISOString().slice(0, 10);
    return { valid: true, formatted, raw: rawDate };
  }

  return { valid: false, formatted: null, raw: rawDate };
}

/**
 * Validate records according to technical requirements
 */
export function validateDataset(rawRecords, columnMapping, companyId = 1) {
  // Check if mapping covers all required fields
  const missingMappings = REQUIRED_FIELDS.filter(f => !columnMapping[f.key]);
  if (missingMappings.length > 0) {
    return {
      success: false,
      error: `Missing column mapping for required field(s): ${missingMappings.map(f => f.label).join(', ')}`,
      missingMappings
    };
  }

  // Fetch existing order IDs in DB for duplicate detection
  const existingOrderRows = db.prepare('SELECT order_id FROM sales WHERE company_id = ?').all(companyId);
  const existingDbOrderIds = new Set(existingOrderRows.map(r => String(r.order_id).trim().toUpperCase()));

  const seenInBatchOrderIds = new Set();
  const validRecords = [];
  const invalidRecords = [];
  const allErrors = [];

  let duplicateCount = 0;
  let missingValueCount = 0;
  let invalidTypeCount = 0;
  let outOfRangeCount = 0;

  rawRecords.forEach((row, index) => {
    const rowNum = index + 1; // 1-based index
    const rowErrors = [];

    // Extract mapped values
    const rawOrderId = row[columnMapping.order_id];
    const rawDate = row[columnMapping.order_date];
    const rawProduct = row[columnMapping.product];
    const rawCategory = row[columnMapping.category];
    const rawRegion = row[columnMapping.region];
    const rawUnits = row[columnMapping.units];
    const rawPrice = row[columnMapping.unit_price];
    const rawCost = row[columnMapping.unit_cost];
    const rawDiscount = row[columnMapping.discount_pct];

    // 1. Missing value check
    if (rawOrderId === undefined || rawOrderId === null || String(rawOrderId).trim() === '') {
      rowErrors.push({ field: 'order_id', label: 'Order ID', value: rawOrderId, message: 'Order ID is required.' });
      missingValueCount++;
    }
    if (rawDate === undefined || rawDate === null || String(rawDate).trim() === '') {
      rowErrors.push({ field: 'order_date', label: 'Order Date', value: rawDate, message: 'Order Date is required.' });
      missingValueCount++;
    }
    if (rawProduct === undefined || rawProduct === null || String(rawProduct).trim() === '') {
      rowErrors.push({ field: 'product', label: 'Product', value: rawProduct, message: 'Product name is required.' });
      missingValueCount++;
    }
    if (rawCategory === undefined || rawCategory === null || String(rawCategory).trim() === '') {
      rowErrors.push({ field: 'category', label: 'Category', value: rawCategory, message: 'Category is required.' });
      missingValueCount++;
    }
    if (rawRegion === undefined || rawRegion === null || String(rawRegion).trim() === '') {
      rowErrors.push({ field: 'region', label: 'Region', value: rawRegion, message: 'Region is required.' });
      missingValueCount++;
    }

    const orderIdStr = rawOrderId !== undefined && rawOrderId !== null ? String(rawOrderId).trim() : '';
    const orderIdKey = orderIdStr.toUpperCase();

    // 2. Duplicate detection
    let isDuplicateInBatch = false;
    let isDuplicateInDb = false;

    if (orderIdKey) {
      if (seenInBatchOrderIds.has(orderIdKey)) {
        isDuplicateInBatch = true;
        duplicateCount++;
        rowErrors.push({
          field: 'order_id',
          label: 'Order ID',
          value: orderIdStr,
          message: `Duplicate Order ID "${orderIdStr}" found within this file.`
        });
      } else {
        seenInBatchOrderIds.add(orderIdKey);
      }

      if (existingDbOrderIds.has(orderIdKey)) {
        isDuplicateInDb = true;
        duplicateCount++;
        rowErrors.push({
          field: 'order_id',
          label: 'Order ID',
          value: orderIdStr,
          message: `Order ID "${orderIdStr}" already exists in the database for this company.`
        });
      }
    }

    // 3. Date validation
    let validDateStr = null;
    if (rawDate !== undefined && rawDate !== null && String(rawDate).trim() !== '') {
      const parsedDate = parseDate(rawDate);
      if (!parsedDate.valid) {
        rowErrors.push({
          field: 'order_date',
          label: 'Order Date',
          value: String(rawDate),
          message: `Invalid date format "${rawDate}". Expected YYYY-MM-DD or DD/MM/YYYY.`
        });
        invalidTypeCount++;
      } else {
        validDateStr = parsedDate.formatted;
      }
    }

    // 4. Units validation (integer, non-negative)
    let parsedUnits = null;
    if (rawUnits === undefined || rawUnits === null || String(rawUnits).trim() === '') {
      rowErrors.push({ field: 'units', label: 'Units', value: rawUnits, message: 'Units sold is required.' });
      missingValueCount++;
    } else {
      const cleanUnitsStr = String(rawUnits).replace(/,/g, '').trim();
      const numUnits = Number(cleanUnitsStr);
      if (isNaN(numUnits) || !Number.isFinite(numUnits)) {
        rowErrors.push({ field: 'units', label: 'Units', value: rawUnits, message: 'Units must be a valid number.' });
        invalidTypeCount++;
      } else if (numUnits < 0) {
        rowErrors.push({ field: 'units', label: 'Units', value: rawUnits, message: 'Units sold cannot be negative.' });
        outOfRangeCount++;
      } else if (!Number.isInteger(numUnits)) {
        rowErrors.push({ field: 'units', label: 'Units', value: rawUnits, message: 'Units sold must be a whole number.' });
        invalidTypeCount++;
      } else {
        parsedUnits = numUnits;
      }
    }

    // 5. Unit Price validation (number, non-negative)
    let parsedPrice = null;
    if (rawPrice === undefined || rawPrice === null || String(rawPrice).trim() === '') {
      rowErrors.push({ field: 'unit_price', label: 'Unit Price', value: rawPrice, message: 'Unit Price is required.' });
      missingValueCount++;
    } else {
      const cleanPriceStr = String(rawPrice).replace(/[₹$,]/g, '').trim();
      const numPrice = Number(cleanPriceStr);
      if (isNaN(numPrice) || !Number.isFinite(numPrice)) {
        rowErrors.push({ field: 'unit_price', label: 'Unit Price', value: rawPrice, message: 'Unit Price must be a valid number.' });
        invalidTypeCount++;
      } else if (numPrice < 0) {
        rowErrors.push({ field: 'unit_price', label: 'Unit Price', value: rawPrice, message: 'Unit Price cannot be negative.' });
        outOfRangeCount++;
      } else {
        parsedPrice = numPrice;
      }
    }

    // 6. Unit Cost validation (number, non-negative)
    let parsedCost = null;
    if (rawCost === undefined || rawCost === null || String(rawCost).trim() === '') {
      rowErrors.push({ field: 'unit_cost', label: 'Unit Cost', value: rawCost, message: 'Unit Cost is required.' });
      missingValueCount++;
    } else {
      const cleanCostStr = String(rawCost).replace(/[₹$,]/g, '').trim();
      const numCost = Number(cleanCostStr);
      if (isNaN(numCost) || !Number.isFinite(numCost)) {
        rowErrors.push({ field: 'unit_cost', label: 'Unit Cost', value: rawCost, message: 'Unit Cost must be a valid number.' });
        invalidTypeCount++;
      } else if (numCost < 0) {
        rowErrors.push({ field: 'unit_cost', label: 'Unit Cost', value: rawCost, message: 'Unit Cost cannot be negative.' });
        outOfRangeCount++;
      } else {
        parsedCost = numCost;
      }
    }

    // 7. Discount percentage validation (0 - 100)
    let parsedDiscount = null;
    if (rawDiscount === undefined || rawDiscount === null || String(rawDiscount).trim() === '') {
      // Default to 0 discount if blank
      parsedDiscount = 0;
    } else {
      const cleanDiscountStr = String(rawDiscount).replace(/[%]/g, '').trim();
      const numDiscount = Number(cleanDiscountStr);
      if (isNaN(numDiscount) || !Number.isFinite(numDiscount)) {
        rowErrors.push({ field: 'discount_pct', label: 'Discount Percentage', value: rawDiscount, message: 'Discount percentage must be a valid number.' });
        invalidTypeCount++;
      } else if (numDiscount < 0 || numDiscount > 100) {
        rowErrors.push({ field: 'discount_pct', label: 'Discount Percentage', value: rawDiscount, message: 'Discount percentage must be between 0 and 100.' });
        outOfRangeCount++;
      } else {
        parsedDiscount = numDiscount;
      }
    }

    if (rowErrors.length > 0) {
      const errorEntry = {
        rowNumber: rowNum,
        orderId: orderIdStr || `Row #${rowNum}`,
        errors: rowErrors,
        isDuplicateInBatch,
        isDuplicateInDb,
        raw: row
      };
      invalidRecords.push(errorEntry);
      rowErrors.forEach(err => {
        allErrors.push({
          rowNumber: rowNum,
          orderId: orderIdStr || `Row #${rowNum}`,
          ...err
        });
      });
    } else {
      // Valid record: compute financial metrics immediately using strict formulas
      const financials = calculateFinancials({
        units: parsedUnits,
        unitPrice: parsedPrice,
        unitCost: parsedCost,
        discountPct: parsedDiscount
      });

      validRecords.push({
        rowNumber: rowNum,
        order_id: orderIdStr,
        order_date: validDateStr,
        product: String(rawProduct).trim(),
        category: String(rawCategory).trim(),
        region: String(rawRegion).trim(),
        units: parsedUnits,
        unit_price: parsedPrice,
        unit_cost: parsedCost,
        discount_pct: parsedDiscount,
        company_id: companyId,
        ...financials
      });
    }
  });

  return {
    success: true,
    totalRecords: rawRecords.length,
    validCount: validRecords.length,
    invalidCount: invalidRecords.length,
    validRecords,
    invalidRecords,
    errors: allErrors,
    summary: {
      total: rawRecords.length,
      valid: validRecords.length,
      invalid: invalidRecords.length,
      duplicateCount,
      missingValueCount,
      invalidTypeCount,
      outOfRangeCount
    }
  };
}
