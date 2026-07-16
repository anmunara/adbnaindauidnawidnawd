/**
 * Sync the Abahcode supplier catalog into local game_types.
 *
 * Abahcode is a dropship source: these rows carry source='abahcode' and a
 * provider_product_id. We do NOT import their stock into redeem_codes — stock
 * is read live from Abahcode at display time and the voucher is bought
 * on-demand when the customer pays.
 *
 * EXCLUDED categories (per business decision):
 *   - Redfinger      -> sold from our own local stock, do not dropship
 *   - ABAHCODE       -> VIP membership, not resold
 *
 * Pricing:
 *   capital_price = Abahcode price (our cost)
 *   selling_price = round up(capital * (1 + ABAHCODE_MARKUP_PCT/100)) to nearest 100
 *   (ABAHCODE_MARKUP_PCT default 15). Adjust per-product later in the dashboard.
 *
 * Idempotent: matches existing rows by provider_product_id and updates them;
 * inserts new ones; leaves local (source='local') products untouched.
 *
 * Usage:  node scripts/sync-abahcode-products.js [--dry]
 */

const path = require('path');
const Database = require('better-sqlite3');

try {
    require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
} catch { /* dotenv optional */ }

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'kingblox.db');
const API_URL = process.env.ABAHCODE_API_URL || 'https://abahcode.com/api/v1.php';
const API_KEY = process.env.ABAHCODE_API_KEY || '';
const MARKUP_PCT = Number(process.env.ABAHCODE_MARKUP_PCT || '15');
const DRY = process.argv.includes('--dry');

// Categories we do NOT dropship (case-insensitive match on category_name).
const EXCLUDED_CATEGORIES = new Set(['redfinger', 'abahcode']);

function sellingFromCapital(capital) {
    const withMargin = capital * (1 + MARKUP_PCT / 100);
    return Math.ceil(withMargin / 100) * 100; // round up to nearest Rp 100
}

async function fetchCatalog() {
    if (!API_KEY) {
        console.error('ERROR: ABAHCODE_API_KEY not set in .env');
        process.exit(1);
    }
    const res = await fetch(`${API_URL}?action=products`, {
        headers: { 'X-API-KEY': API_KEY },
    });
    const json = await res.json();
    if (json.status !== true || !Array.isArray(json.data)) {
        console.error('ERROR: unexpected Abahcode response:', JSON.stringify(json).slice(0, 300));
        process.exit(1);
    }
    return json.data;
}

(async () => {
    const catalog = await fetchCatalog();
    console.log(`Fetched ${catalog.length} products from Abahcode.`);

    const kept = catalog.filter((p) => {
        const cat = String(p.category_name || '').trim().toLowerCase();
        return !EXCLUDED_CATEGORIES.has(cat);
    });
    const excludedCount = catalog.length - kept.length;
    console.log(`Excluded ${excludedCount} products (Redfinger / ABAHCODE VIP).`);
    console.log(`Syncing ${kept.length} dropship products (markup ${MARKUP_PCT}%).`);

    if (DRY) {
        for (const p of kept) {
            const cap = Math.floor(Number(p.price) || 0);
            console.log(`  [${p.category_name}] ${String(p.name).trim()} — cost ${cap} -> sell ${sellingFromCapital(cap)} (stock ${p.stock})`);
        }
        console.log('\nDry run — no DB writes.');
        return;
    }

    const db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');

    // Confirm the new columns exist (migration must have run).
    const cols = db.prepare('PRAGMA table_info(game_types)').all().map((c) => c.name);
    if (!cols.includes('source') || !cols.includes('provider_product_id')) {
        console.error('ERROR: game_types is missing source/provider_product_id.');
        console.error('Run: node scripts/migrate-add-abahcode.js first.');
        process.exit(1);
    }

    const now = new Date().toISOString();
    const findByProvider = db.prepare(
        "SELECT id FROM game_types WHERE source='abahcode' AND provider_product_id = ?"
    );
    const insertType = db.prepare(`INSERT INTO game_types
        (id, name, selling_price, capital_price, category, source, provider_product_id, created_at)
        VALUES (@id, @name, @selling_price, @capital_price, @category, 'abahcode', @provider_product_id, @created_at)`);
    const updateType = db.prepare(`UPDATE game_types
        SET name=@name, capital_price=@capital_price, category=@category
        WHERE id=@id`);

    let inserted = 0, updated = 0;

    const run = db.transaction(() => {
        for (const p of kept) {
            const providerId = String(p.id);
            const name = String(p.name || '').trim() || `Product ${providerId}`;
            const capital = Math.floor(Number(p.price) || 0);
            const category = String(p.category_name || 'Abahcode').trim();

            const existing = findByProvider.get(providerId);
            if (existing) {
                // Preserve admin-tuned selling_price; only refresh cost/name/category.
                updateType.run({ id: existing.id, name, capital_price: capital, category });
                updated++;
            } else {
                const id = 'abah_' + providerId + '_' + Math.random().toString(36).slice(2, 8);
                insertType.run({
                    id,
                    name,
                    selling_price: sellingFromCapital(capital),
                    capital_price: capital,
                    category,
                    provider_product_id: providerId,
                    created_at: now,
                });
                inserted++;
            }
        }
    });
    run();

    console.log(`\nSync complete: ${inserted} inserted, ${updated} updated.`);
    console.log('Note: existing selling_price is preserved on update — tune margins in the dashboard.');
    db.close();
})();
