import express from 'express';
import multer from 'multer';
import path from 'path';
import { parseUploadedFile } from '../services/parser.js';
import { autoMapColumns, validateDataset, REQUIRED_FIELDS } from '../services/validator.js';
import { db } from '../db.js';

const router = express.Router();

// Configure multer with memory storage and security constraints
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.csv', '.xlsx', '.xls'];
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/octet-stream' // Browsers often send this for csv/xlsx
    ];

    if (!allowedExts.includes(ext)) {
      return cb(new Error(`Invalid file type "${ext}". Only .csv and .xlsx files are supported.`));
    }
    cb(null, true);
  }
});

/**
 * POST /api/import
 * Parses and validates uploaded file, returns metadata, column mapping, and error report.
 */
router.post('/', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 25 MB limit.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please select a CSV or XLSX file.' });
    }

    try {
      const companyId = parseInt(req.body.companyId || '1', 10);
      const parsed = parseUploadedFile(req.file.buffer, req.file.originalname, req.file.mimetype);

      // Auto-map columns or use custom mapping provided by client
      let columnMapping = null;
      if (req.body.columnMapping) {
        try {
          columnMapping = typeof req.body.columnMapping === 'string' 
            ? JSON.parse(req.body.columnMapping) 
            : req.body.columnMapping;
        } catch (e) {
          // Fallback to auto
        }
      }

      if (!columnMapping) {
        columnMapping = autoMapColumns(parsed.columns);
      }

      // Check if all required columns could be mapped
      const unmappedFields = REQUIRED_FIELDS.filter(f => !columnMapping[f.key]);

      let validationResult = null;
      if (unmappedFields.length === 0) {
        validationResult = validateDataset(parsed.records, columnMapping, companyId);
      }

      return res.json({
        success: true,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        totalRecords: parsed.totalRows,
        columns: parsed.columns,
        format: parsed.format,
        columnMapping,
        requiredFields: REQUIRED_FIELDS,
        unmappedFields,
        validationResult,
        previewRows: parsed.records.slice(0, 15)
      });
    } catch (parseError) {
      return res.status(400).json({
        error: parseError.message || 'Failed to process file.'
      });
    }
  });
});

/**
 * POST /api/import/validate-custom-mapping
 * Re-validates raw records with updated column mappings
 */
router.post('/validate-custom-mapping', (req, res) => {
  try {
    const { records, columnMapping, companyId = 1 } = req.body;
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Missing records payload for validation.' });
    }
    if (!columnMapping) {
      return res.status(400).json({ error: 'Missing columnMapping for validation.' });
    }

    const validationResult = validateDataset(records, columnMapping, companyId);
    return res.json({ success: true, validationResult });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/import/confirm
 * Commits validated records into SQLite inside a database transaction with rollback.
 */
router.post('/confirm', (req, res) => {
  try {
    const {
      fileName,
      fileSize,
      records,
      companyId = 1,
      duplicateMode = 'skip', // 'skip', 'replace', or 'error'
      rejectedCount = 0
    } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No valid records provided for database insertion.' });
    }

    // 1. Create batch record with 'pending' status
    const batchInsert = db.prepare(`
      INSERT INTO import_batches (
        company_id, file_name, file_size, total_records, valid_records, invalid_records, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(companyId, fileName || 'upload.csv', fileSize || 0, records.length + rejectedCount, records.length, rejectedCount);

    const batchId = batchInsert.lastInsertRowid;

    // 2. Perform insertion inside a SQLite transaction
    const insertTransaction = db.transaction((rowsToInsert) => {
      let insertedCount = 0;
      let skippedCount = 0;
      let replacedCount = 0;

      let insertSql;
      if (duplicateMode === 'replace') {
        insertSql = `
          INSERT INTO sales (
            order_id, company_id, order_date, product, category, region,
            units, unit_price, unit_cost, discount_pct, gross_sales, discount_amount,
            revenue, cogs, gross_profit, gross_margin, import_batch_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(company_id, order_id) DO UPDATE SET
            order_date = excluded.order_date,
            product = excluded.product,
            category = excluded.category,
            region = excluded.region,
            units = excluded.units,
            unit_price = excluded.unit_price,
            unit_cost = excluded.unit_cost,
            discount_pct = excluded.discount_pct,
            gross_sales = excluded.gross_sales,
            discount_amount = excluded.discount_amount,
            revenue = excluded.revenue,
            cogs = excluded.cogs,
            gross_profit = excluded.gross_profit,
            gross_margin = excluded.gross_margin,
            import_batch_id = excluded.import_batch_id
        `;
      } else if (duplicateMode === 'skip') {
        insertSql = `
          INSERT OR IGNORE INTO sales (
            order_id, company_id, order_date, product, category, region,
            units, unit_price, unit_cost, discount_pct, gross_sales, discount_amount,
            revenue, cogs, gross_profit, gross_margin, import_batch_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
      } else {
        // Strict error mode: fail immediately if duplicate
        insertSql = `
          INSERT INTO sales (
            order_id, company_id, order_date, product, category, region,
            units, unit_price, unit_cost, discount_pct, gross_sales, discount_amount,
            revenue, cogs, gross_profit, gross_margin, import_batch_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
      }

      const stmt = db.prepare(insertSql);

      for (const row of rowsToInsert) {
        const result = stmt.run(
          String(row.order_id).trim(),
          companyId,
          row.order_date,
          row.product,
          row.category,
          row.region,
          row.units,
          row.unit_price,
          row.unit_cost,
          row.discount_pct,
          row.grossSales,
          row.discountAmount,
          row.revenue,
          row.cogs,
          row.grossProfit,
          row.grossMargin,
          batchId
        );

        if (result.changes > 0) {
          insertedCount++;
        } else {
          skippedCount++;
        }
      }

      // Mark batch completed
      db.prepare(`
        UPDATE import_batches 
        SET status = 'completed', valid_records = ?
        WHERE id = ?
      `).run(insertedCount, batchId);

      return { insertedCount, skippedCount, replacedCount };
    });

    try {
      const stats = insertTransaction(records);
      return res.json({
        success: true,
        message: `Successfully imported ${stats.insertedCount} records into the database.`,
        batchId,
        ...stats
      });
    } catch (txError) {
      // Rollback occurred automatically by better-sqlite3
      db.prepare(`
        UPDATE import_batches 
        SET status = 'rolled_back', error_message = ?
        WHERE id = ?
      `).run(txError.message, batchId);

      return res.status(400).json({
        error: `Import failed and changes were rolled back: ${txError.message}`,
        batchId
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/import/batches
 * Returns batch history
 */
router.get('/batches', (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId || '1', 10);
    const batches = db.prepare(`
      SELECT 
        id, file_name, file_size, total_records, valid_records, invalid_records,
        status, imported_at, error_message
      FROM import_batches
      WHERE company_id = ?
      ORDER BY id DESC
    `).all(companyId);

    return res.json({ success: true, batches });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
