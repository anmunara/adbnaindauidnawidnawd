/**
 * One-time import of the redeem-codes CSV export into SQLite.
 *
 * Source: redeem-codes-2026-06-04-08-14-57.csv (Firestore export)
 * - Strips the product-name suffix that got concatenated into the Code column.
 * - Recreates the 6 game_types using their original Firestore document IDs
 *   (so any historical order referencing them stays consistent).
 * - Imports 56 codes: READY -> is_used=0, TERJUAL -> is_used=1 (+ sold_to / tx).
 *
 * IMPORTANT: capital_price comes from the user's modal list. selling_price is
 * set EQUAL to capital_price as a placeholder so the store is functional and
 * never sells below cost. Update selling_price in the admin dashboard before
 * going live to add margin.
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const CSV = process.argv[2] || path.join('C:', 'Users', 'lucia', 'Downloads', 'redeem-codes-2026-06-04-08-14-57.csv');
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'kingblox.db');
const SCHEMA_PATH = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');

// type_id -> { name, capital }  (verified against the CSV + user's prices)
const PRODUCTS = {
    e1lPxAOtYs9Wn5hzBxSr: { name: 'VIP 7 Hari', capital: 18800 },
    '7L2Jj4lNgwTrznhCh2pY': { name: 'VIP 30 Hari', capital: 55964 },
    XrvmCNML88O7U9phUklF: { name: 'KVIP 7 Hari', capital: 33229 },
    bRzmyeOnidBymh5l1azx: { name: 'KVIP 30 Hari', capital: 95313 },
    fwVJrkI1G1Q94QbdQvUP: { name: 'SVIP 7 Hari', capital: 41098 },
    pvGSckRRHsnXFrMJe2p7: { name: 'SVIP 30 Hari', capital: 121546 },
};

function parseLine(line) {
    const out = []; let cur = ''; let q = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
        else { if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; }
    }
    out.push(cur); return out;
}

function extractCode(cell) {
    // Code column may be "XXXX-XXXX-XXXX    ProductName" or just "XXXX-XXXX-XXXX"
    const m = cell.match(/^([A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4})/);
    return m ? m[1] : cell.trim();
}

function genId(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// --- read + parse CSV --------------------------------------------------------
const raw = fs.readFileSync(CSV, 'utf8').replace(/^﻿/, '');
const lines = raw.split(/\r?\n/).filter((l) => l.trim().length);
const rows = lines.slice(1).map(parseLine); // skip header

// --- open DB (do NOT wipe; admin user already seeded) -----------------------
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
const hasUsers = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
if (!hasUsers) db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));

const now = new Date().toISOString();

const upsertType = db.prepare(`INSERT OR REPLACE INTO game_types
    (id, name, selling_price, capital_price, category, created_at)
    VALUES (@id, @name, @selling_price, @capital_price, 'redfinger', @created_at)`);

const insertCode = db.prepare(`INSERT OR IGNORE INTO redeem_codes
    (id, code, type_id, note, is_used, sold_to, transaction_id, sold_at, created_at, updated_at)
    VALUES (@id, @code, @type_id, @note, @is_used, @sold_to, @transaction_id, @sold_at, @created_at, @updated_at)`);

let typeCount = 0, codeCount = 0, soldCount = 0, skipped = 0;

const run = db.transaction(() => {
    // products
    for (const [id, p] of Object.entries(PRODUCTS)) {
        upsertType.run({
            id,
            name: p.name,
            selling_price: p.capital, // placeholder = capital; user must add margin
            capital_price: p.capital,
            created_at: now,
        });
        typeCount++;
    }

    // codes
    for (const r of rows) {
        const code = extractCode(r[0]);
        const typeId = r[1];
        const status = (r[2] || '').toUpperCase();
        const soldTo = r[4] || null;
        const txId = r[5] || null;
        const createdAt = r[6] || now;
        const soldAt = r[7] || null;

        if (!PRODUCTS[typeId]) { skipped++; continue; }
        const isUsed = status === 'TERJUAL' ? 1 : 0;
        if (isUsed) soldCount++;

        const res = insertCode.run({
            id: genId('code_'),
            code,
            type_id: typeId,
            note: null,
            is_used: isUsed,
            sold_to: isUsed ? soldTo : null,
            transaction_id: isUsed ? txId : null,
            sold_at: isUsed ? soldAt : null,
            created_at: createdAt,
            updated_at: now,
        });
        if (res.changes === 1) codeCount++; else skipped++;
    }
});
run();

console.log('Import complete:');
console.log('  Products (game_types):', typeCount);
console.log('  Codes imported:', codeCount, '(of', rows.length, 'rows)');
console.log('  Marked TERJUAL (is_used=1):', soldCount);
console.log('  Skipped (dup/unknown type):', skipped);

// verify
const totalCodes = db.prepare('SELECT COUNT(*) c FROM redeem_codes').get().c;
const ready = db.prepare('SELECT COUNT(*) c FROM redeem_codes WHERE is_used=0').get().c;
console.log('\nDB now has', totalCodes, 'codes |', ready, 'READY |', totalCodes - ready, 'sold');
db.close();
