import fs from 'fs';
import * as XLSX from 'xlsx';

const sampleRows = [
  { 'Order ID': 'ORD-1001', 'Order Date': '2026-01-05', 'Product': 'Wireless Mouse', 'Category': 'Electronics', 'Region': 'North', 'Units': 18, 'Unit Price': 899, 'Unit Cost': 480, 'Discount Percentage': 5 },
  { 'Order ID': 'ORD-1002', 'Order Date': '2026-01-09', 'Product': 'Office Chair', 'Category': 'Furniture', 'Region': 'West', 'Units': 4, 'Unit Price': 6499, 'Unit Cost': 4300, 'Discount Percentage': 10 },
  { 'Order ID': 'ORD-1003', 'Order Date': '2026-01-14', 'Product': 'Notebook Set', 'Category': 'Stationery', 'Region': 'South', 'Units': 32, 'Unit Price': 299, 'Unit Cost': 155, 'Discount Percentage': 0 },
  { 'Order ID': 'ORD-1004', 'Order Date': '2026-01-21', 'Product': 'Bluetooth Speaker', 'Category': 'Electronics', 'Region': 'East', 'Units': 9, 'Unit Price': 2499, 'Unit Cost': 1600, 'Discount Percentage': 8 },
  { 'Order ID': 'ORD-1005', 'Order Date': '2026-02-03', 'Product': 'Desk Lamp', 'Category': 'Furniture', 'Region': 'North', 'Units': 13, 'Unit Price': 1299, 'Unit Cost': 700, 'Discount Percentage': 5 },
  { 'Order ID': 'ORD-1006', 'Order Date': '2026-02-08', 'Product': 'Premium Pens', 'Category': 'Stationery', 'Region': 'West', 'Units': 26, 'Unit Price': 199, 'Unit Cost': 85, 'Discount Percentage': 0 },
  { 'Order ID': 'ORD-1007', 'Order Date': '2026-02-15', 'Product': 'Mechanical Keyboard', 'Category': 'Electronics', 'Region': 'South', 'Units': 7, 'Unit Price': 3499, 'Unit Cost': 2200, 'Discount Percentage': 12 },
  { 'Order ID': 'ORD-1008', 'Order Date': '2026-02-24', 'Product': 'Bookshelf', 'Category': 'Furniture', 'Region': 'East', 'Units': 3, 'Unit Price': 7999, 'Unit Cost': 5600, 'Discount Percentage': 8 },
  { 'Order ID': 'ORD-1009', 'Order Date': '2026-03-04', 'Product': 'Wireless Mouse', 'Category': 'Electronics', 'Region': 'West', 'Units': 24, 'Unit Price': 899, 'Unit Cost': 480, 'Discount Percentage': 0 },
  { 'Order ID': 'ORD-1010', 'Order Date': '2026-03-10', 'Product': 'Notebook Set', 'Category': 'Stationery', 'Region': 'North', 'Units': 41, 'Unit Price': 299, 'Unit Cost': 155, 'Discount Percentage': 5 },
  { 'Order ID': 'ORD-1011', 'Order Date': '2026-03-17', 'Product': 'Office Chair', 'Category': 'Furniture', 'Region': 'South', 'Units': 6, 'Unit Price': 6499, 'Unit Cost': 4300, 'Discount Percentage': 15 },
  { 'Order ID': 'ORD-1012', 'Order Date': '2026-03-26', 'Product': 'Bluetooth Speaker', 'Category': 'Electronics', 'Region': 'East', 'Units': 12, 'Unit Price': 2499, 'Unit Cost': 1600, 'Discount Percentage': 5 },
  { 'Order ID': 'ORD-1013', 'Order Date': '2026-04-02', 'Product': 'Premium Pens', 'Category': 'Stationery', 'Region': 'North', 'Units': 35, 'Unit Price': 199, 'Unit Cost': 85, 'Discount Percentage': 0 },
  { 'Order ID': 'ORD-1014', 'Order Date': '2026-04-11', 'Product': 'Desk Lamp', 'Category': 'Furniture', 'Region': 'West', 'Units': 17, 'Unit Price': 1299, 'Unit Cost': 700, 'Discount Percentage': 10 },
  { 'Order ID': 'ORD-1015', 'Order Date': '2026-04-16', 'Product': 'Mechanical Keyboard', 'Category': 'Electronics', 'Region': 'South', 'Units': 11, 'Unit Price': 3499, 'Unit Cost': 2200, 'Discount Percentage': 5 },
  { 'Order ID': 'ORD-1016', 'Order Date': '2026-04-27', 'Product': 'Notebook Set', 'Category': 'Stationery', 'Region': 'East', 'Units': 48, 'Unit Price': 299, 'Unit Cost': 155, 'Discount Percentage': 0 },
  { 'Order ID': 'ORD-1017', 'Order Date': '2026-05-05', 'Product': 'Bookshelf', 'Category': 'Furniture', 'Region': 'North', 'Units': 5, 'Unit Price': 7999, 'Unit Cost': 5600, 'Discount Percentage': 12 },
  { 'Order ID': 'ORD-1018', 'Order Date': '2026-05-12', 'Product': 'Wireless Mouse', 'Category': 'Electronics', 'Region': 'South', 'Units': 29, 'Unit Price': 899, 'Unit Cost': 480, 'Discount Percentage': 8 },
  { 'Order ID': 'ORD-1019', 'Order Date': '2026-05-19', 'Product': 'Premium Pens', 'Category': 'Stationery', 'Region': 'West', 'Units': 44, 'Unit Price': 199, 'Unit Cost': 85, 'Discount Percentage': 5 },
  { 'Order ID': 'ORD-1020', 'Order Date': '2026-05-28', 'Product': 'Office Chair', 'Category': 'Furniture', 'Region': 'East', 'Units': 7, 'Unit Price': 6499, 'Unit Cost': 4300, 'Discount Percentage': 5 },
  { 'Order ID': 'ORD-1021', 'Order Date': '2026-06-03', 'Product': 'Bluetooth Speaker', 'Category': 'Electronics', 'Region': 'North', 'Units': 15, 'Unit Price': 2499, 'Unit Cost': 1600, 'Discount Percentage': 0 },
  { 'Order ID': 'ORD-1022', 'Order Date': '2026-06-09', 'Product': 'Notebook Set', 'Category': 'Stationery', 'Region': 'South', 'Units': 53, 'Unit Price': 299, 'Unit Cost': 155, 'Discount Percentage': 5 },
  { 'Order ID': 'ORD-1023', 'Order Date': '2026-06-18', 'Product': 'Desk Lamp', 'Category': 'Furniture', 'Region': 'East', 'Units': 21, 'Unit Price': 1299, 'Unit Cost': 700, 'Discount Percentage': 5 },
  { 'Order ID': 'ORD-1024', 'Order Date': '2026-06-25', 'Product': 'Mechanical Keyboard', 'Category': 'Electronics', 'Region': 'West', 'Units': 14, 'Unit Price': 3499, 'Unit Cost': 2200, 'Discount Percentage': 10 }
];

// Write data/sales.csv
const csvHeaders = Object.keys(sampleRows[0]);
const csvLines = [csvHeaders.join(',')];
for (const r of sampleRows) {
  csvLines.push(csvHeaders.map(h => `"${r[h]}"`).join(','));
}
fs.writeFileSync('data/sales.csv', csvLines.join('\n'));

// Write data/sample_sales.xlsx
const ws = XLSX.utils.json_to_sheet(sampleRows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'SalesData');
XLSX.writeFile(wb, 'data/sample_sales.xlsx');

// Write data/test_with_errors.csv
const errorRows = [
  'Order ID,Order Date,Product,Category,Region,Units,Unit Price,Unit Cost,Discount Percentage',
  'ORD-9001,2026-03-01,Valid Product,Electronics,North,10,500,300,5',
  ',2026-03-02,Missing Order ID,Electronics,North,5,200,100,0',
  'ORD-9003,invalid-date,Bad Date,Furniture,South,2,1000,500,10',
  'ORD-9004,2026-03-04,Negative Units,Stationery,East,-5,100,50,0',
  'ORD-9005,2026-03-05,Negative Cost,Electronics,West,10,500,-100,5',
  'ORD-9006,2026-03-06,Excess Discount,Furniture,North,3,1500,800,150',
  'ORD-9007,2026-03-07,Invalid Number Price,Stationery,South,10,not_a_number,50,0',
  'ORD-9001,2026-03-08,Duplicate Order ID,Electronics,West,4,500,300,5'
];
fs.writeFileSync('data/test_with_errors.csv', errorRows.join('\n'));

// Write data/diff_headers.csv for column mapping test
const diffHeaderRows = [
  'Order No,Date,Item Name,Department,Territory,Quantity,Selling Price,Item Cost,Discount Rate',
  'ORD-8001,2026-04-01,USB Hub,Electronics,East,12,799,400,5',
  'ORD-8002,2026-04-02,Desk Mat,Furniture,West,8,599,250,10'
];
fs.writeFileSync('data/diff_headers.csv', diffHeaderRows.join('\n'));

console.log('Sample data files created successfully.');
