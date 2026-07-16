/**
 * Migration: add Abahcode dropship support columns to game_types.
 *
 * Fresh installs get these from schema.sql automatically. This script is for
 * EXISTING databases created before the Abahcode integration.
 *
 * Adds (idempotent — safe to re-run):
 *   game_types.source              TEXT DEFAULT 'local'
 *   game_types.provider_product_id TEXT
 *   index idx_game_types_source
 *
 * Usage:  node scripts/migrate-add-abahcode.js
 */

const path = require('path');
const Database = require('better-sqlite3');

try {
    require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
} catch { /* dotenv optional */ }

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'kingblox.db');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

const cols = db.prepare('PRAGMA table_info(game_types)').all().map((c) => c.name);

let changed = 0;

if (!cols.includes('source')) {
    db.exec("ALTER TABLE game_types ADD COLUMN source TEXT DEFAULT 'local'");
    console.log("Added game_types.source (default 'local')");
    changed++;
} else {
    console.log('game_types.source already present — skipping');
}

if (!cols.includes('provider_product_id')) {
    db.exec('ALTER TABLE game_types ADD COLUMN provider_product_id TEXT');
    console.log('Added game_types.provider_product_id');
    changed++;
} else {
    console.log('game_types.provider_product_id already present — skipping');
}

db.exec('CREATE INDEX IF NOT EXISTS idx_game_types_source ON game_types(source)');

// provider_invoice: Abahcode invoice_no for dropship fulfilment audit trail.
for (const table of ['orders', 'transactions']) {
    const tcols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
    if (!tcols.includes('provider_invoice')) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN provider_invoice TEXT`);
        console.log(`Added ${table}.provider_invoice`);
        changed++;
    } else {
        console.log(`${table}.provider_invoice already present — skipping`);
    }
}

// Backfill: any existing rows with NULL source become 'local'.
const backfilled = db.prepare("UPDATE game_types SET source = 'local' WHERE source IS NULL").run();
if (backfilled.changes > 0) {
    console.log(`Backfilled ${backfilled.changes} existing rows to source='local'`);
}

console.log(`\nMigration complete (${changed} column(s) added).`);
db.close();
