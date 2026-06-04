/**
 * Data migration — export from Firebase/Firestore, import into SQLite.
 *
 * Only needed if you have EXISTING production data in Firebase to bring over.
 * For a fresh install, use scripts/seed.js instead.
 *
 * Setup:
 *   1. npm install firebase-admin   (dev-only; not needed at runtime)
 *   2. Put your Firebase service account JSON path in .env:
 *        FIREBASE_SERVICE_ACCOUNT=./service-account.json
 *   3. node scripts/migrate-from-firebase.js
 *
 * Field names are converted from Firestore camelCase to SQLite snake_case.
 * Timestamps (Firestore Timestamp / {seconds} / Date) are normalised to ISO 8601.
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// dotenv is optional — only needed if config lives in .env.
try {
    require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
} catch { /* dotenv not installed; rely on process env */ }

// --- camelCase -> snake_case key map (per collection) -----------------------
const FIELD_MAP = {
    sellingPrice: 'selling_price',
    capitalPrice: 'capital_price',
    typeId: 'type_id',
    isUsed: 'is_used',
    soldTo: 'sold_to',
    transactionId: 'transaction_id',
    soldAt: 'sold_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    userId: 'user_id',
    userEmail: 'user_email',
    itemId: 'item_id',
    itemName: 'item_name',
    paymentMethod: 'payment_method',
    qrString: 'qr_string',
    vaNumber: 'va_number',
    paymentUrl: 'payment_url',
    duitkuReference: 'duitku_reference',
    expiryTime: 'expiry_time',
    redeemCode: 'redeem_code',
    paidAt: 'paid_at',
    resentAt: 'resent_at',
    deliveredAt: 'delivered_at',
    dmMessageId: 'dm_message_id',
    dmChannelId: 'dm_channel_id',
    merchantOrderId: 'order_id',
    passwordHash: 'password_hash',
};

function toIso(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'string') return v;
    if (typeof v.toDate === 'function') return v.toDate().toISOString();
    if (typeof v === 'object' && v.seconds) return new Date(v.seconds * 1000).toISOString();
    if (typeof v === 'object' && v._seconds) return new Date(v._seconds * 1000).toISOString();
    if (v instanceof Date) return v.toISOString();
    return v;
}

function convertDoc(data, idField, id) {
    const out = {};
    out[idField] = id;
    for (const [k, v] of Object.entries(data)) {
        const key = FIELD_MAP[k] || k;
        let val = v;
        if (key.endsWith('_at') || key === 'expiry_time') val = toIso(v);
        else if (typeof v === 'boolean') val = v ? 1 : 0;
        else if (v && typeof v === 'object' && (v.seconds || v._seconds || v.toDate)) val = toIso(v);
        else if (v && typeof v === 'object') val = JSON.stringify(v);
        out[key] = val;
    }
    return out;
}

async function main() {
    const saPath = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!saPath) {
        console.error('Set FIREBASE_SERVICE_ACCOUNT in .env to your service-account.json path.');
        process.exit(1);
    }

    let admin;
    try {
        admin = require('firebase-admin');
    } catch (e) {
        console.error('firebase-admin not installed. Run: npm install firebase-admin');
        process.exit(1);
    }

    const serviceAccount = require(path.resolve(process.cwd(), saPath));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    const fdb = admin.firestore();

    const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'kingblox.db');
    const SCHEMA_PATH = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    const sdb = new Database(DB_PATH);
    sdb.pragma('foreign_keys = OFF'); // import order-independent
    const hasUsers = sdb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (!hasUsers) sdb.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));

    // collection -> primary key column in SQLite
    const COLLECTIONS = {
        users: 'id',
        game_types: 'id',
        redeem_codes: 'id',
        orders: 'order_id',
        transactions: 'order_id',
    };

    const tableColumns = (table) => {
        const rows = sdb.prepare(`PRAGMA table_info(${table})`).all();
        return new Set(rows.map((r) => r.name));
    };

    for (const [coll, pk] of Object.entries(COLLECTIONS)) {
        const cols = tableColumns(coll);
        const snap = await fdb.collection(coll).get();
        let imported = 0;

        const insert = (row) => {
            const now = new Date().toISOString();
            if (cols.has('created_at') && !row.created_at) row.created_at = now;
            if (cols.has('updated_at') && !row.updated_at) row.updated_at = now;
            const fields = Object.keys(row).filter((f) => cols.has(f));
            const placeholders = fields.map(() => '?').join(', ');
            const values = fields.map((f) => row[f]);
            sdb.prepare(`INSERT OR REPLACE INTO ${coll} (${fields.join(', ')}) VALUES (${placeholders})`).run(...values);
        };

        const tx = sdb.transaction(() => {
            snap.forEach((doc) => {
                insert(convertDoc(doc.data(), pk, doc.id));
                imported++;
            });
        });
        tx();

        console.log(`${coll}: imported ${imported} documents`);
    }

    sdb.pragma('foreign_keys = ON');
    sdb.close();
    console.log('\nMigration complete.');
}

main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
