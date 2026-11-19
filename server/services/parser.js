import { parse as parseCsv } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import path from 'path';

export function parseUploadedFile(fileBuffer, originalFilename, mimeType) {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('The uploaded file is empty. Please upload a valid CSV or Excel file.');
  }

  const ext = path.extname(originalFilename).toLowerCase();

  if (ext === '.csv' || mimeType === 'text/csv' || mimeType === 'application/vnd.ms-excel') {
    return parseCsvBuffer(fileBuffer);
  } else if (ext === '.xlsx' || ext === '.xls' || 
             mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
             mimeType === 'application/vnd.ms-excel') {
    return parseExcelBuffer(fileBuffer);
  } else {
    throw new Error(`Unsupported file format "${ext}". Supported formats are .csv and .xlsx`);
  }
}

function parseCsvBuffer(buffer) {
  try {
    const records = parseCsv(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
    });

    if (!records || records.length === 0) {
      throw new Error('CSV file contains no data rows or header.');
    }

    const columns = Object.keys(records[0] || {});
    if (columns.length === 0) {
      throw new Error('Could not detect column headers in the CSV file.');
    }

    return {
      columns,
      totalRows: records.length,
      records,
      format: 'csv'
    };
  } catch (err) {
    if (err.message.includes('CSV file contains no data')) {
      throw err;
    }
    throw new Error(`Failed to parse CSV file: ${err.message}`);
  }
}

function parseExcelBuffer(buffer) {
  try {
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: true,
      dateNF: 'yyyy-mm-dd'
    });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('Excel workbook contains no sheets.');
    }

    const worksheet = workbook.Sheets[sheetName];
    // Convert to JSON with raw values and dates handled
    const rawRecords = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      raw: false,
      dateNF: 'yyyy-mm-dd'
    });

    if (!rawRecords || rawRecords.length === 0) {
      throw new Error('Excel sheet is empty or contains no data rows.');
    }

    const columns = Object.keys(rawRecords[0] || {});
    if (columns.length === 0) {
      throw new Error('Could not detect column headers in the Excel file.');
    }

    return {
      columns,
      totalRows: rawRecords.length,
      records: rawRecords,
      format: 'excel',
      sheetName
    };
  } catch (err) {
    if (err.message.includes('Excel')) {
      throw err;
    }
    throw new Error(`Failed to parse Excel file: ${err.message}`);
  }
}
