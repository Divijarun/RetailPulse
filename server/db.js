import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database/retailpulse.db');
const schemaPath = path.resolve(__dirname, '../sql/schema.sql');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite connection
export const db = new Database(dbPath, {
  // verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// Enable WAL mode and foreign keys for durability and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
export function initDatabase() {
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schemaSql);
  }

  // Seed default company if none exists
  const existingCompany = db.prepare('SELECT id FROM companies WHERE id = 1').get();
  if (!existingCompany) {
    db.prepare(`
      INSERT INTO companies (id, name, code, currency)
      VALUES (1, 'TRADEFRAME Primary Store', 'TF-MAIN', 'INR')
    `).run();
  }
}

// Call on startup
initDatabase();

export default db;
