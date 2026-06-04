/**
 * One-time repair: backfill NULL primary keys.
 *
 * Codes (and any rows) added through the admin panel before the doc() id fix
 * were inserted with a NULL primary key, which breaks edit/delete ("Invalid
 * code ID") and makes the copy button stick (null === null). This assigns a
 * fresh id to every NULL-id row, targeting them by rowid.
 *
 * Usage (on the server, with the app stopped):
 *   node scripts/repair-null-ids.js
 */

const path = require('path');
const Database = require('better-sqlite3');

try {
    require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
} catch { /* dotenv optional */ }

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'kingblox.db');

// table -> primary key column (only TEXT-PK tables can hold a NULL id)
const TABLES = {
    redeem_codes: 'id',
    game_types: 'id',
    users: 'id',
};

function genId(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

const db = new Database(DB_PATH);
db.pragma('foreign_keys = OFF'); // we only touch PKs of the row itself

let total = 0;
for (const [table, pk] of Object.entries(TABLES)) {
    const broken = db.prepare(`SELECT rowid FROM ${table} WHERE ${pk} IS NULL OR ${pk} = ''`).all();
    if (broken.length === 0) {
        console.log(`${table}: ok (no NULL ids)`);
        continue;
    }
    const upd = db.prepare(`UPDATE ${table} SET ${pk} = ? WHERE rowid = ?`);
    const fix = db.transaction(() => {
        for (const row of broken) {
            upd.run(genId(table === 'users' ? 'usr_' : 'code_'), row.rowid);
        }
    });
    fix();
    total += broken.length;
    console.log(`${table}: repaired ${broken.length} NULL-id row(s)`);
}

db.pragma('foreign_keys = ON');
db.close();
console.log(total === 0 ? '\nNothing to repair.' : `\nDone. Repaired ${total} row(s).`);
