import { db } from '@/lib/db';
import { cacheGet, cacheSet, cachePeek } from '@/lib/memoryCache';
import { getProducts as getAbahcodeProducts } from '@/lib/abahcode';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // No CDN/page cache; we manage freshness in-process

const CACHE_KEY = 'products:get';
// Long-lived "last known good" snapshot, never auto-expires. Served on database
// errors so the store doesn't falsely show "tutup".
const LKG_KEY = 'products:get:lastGood';
const CACHE_TTL_MS = 300_000; // 300s — 5 min, cuts database reads heavily; stock is also refreshed right after each delivery

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const fresh = url.searchParams.get('fresh') === '1';

        // Serve from short-lived in-memory cache unless ?fresh=1 is passed.
        if (!fresh) {
            const cached = cacheGet(CACHE_KEY, CACHE_TTL_MS);
            if (cached !== undefined) {
                console.log(`[products/get] cache hit (${cached.length} products)`);
                return Response.json({ success: true, data: cached, cached: true });
            }
        }

        // Fetch all game types
        const typesSnapshot = await db.collection('game_types').get();

        // Abahcode dropship products read live stock from the supplier catalog
        // (keyed by provider_product_id). Fetch it once, tolerate failure — if
        // Abahcode is unreachable we fall back to stock 0 for those items so we
        // never oversell what we can't buy.
        const hasAbahcode = typesSnapshot.docs.some((d) => d.data().source === 'abahcode');
        let abahStockById = null;
        if (hasAbahcode) {
            try {
                const catalog = await getAbahcodeProducts();
                abahStockById = {};
                for (const p of catalog) {
                    abahStockById[String(p.id)] = Number(p.stock) || 0;
                }
            } catch (e) {
                console.error('[products/get] Abahcode stock fetch failed:', e.message);
                abahStockById = null; // signal: supplier unreachable
            }
        }

        const products = [];

        // For each type, resolve available stock
        for (const typeDoc of typesSnapshot.docs) {
            const typeData = typeDoc.data();
            const typeId = typeDoc.id;

            // Backfill missing category — old products default to 'redfinger'
            let category = typeData.category;
            if (!category) {
                category = 'redfinger';
                await typeDoc.ref.update({ category }).catch(() => {});
            }

            const source = typeData.source || 'local';
            let stock;
            if (source === 'abahcode') {
                // Live supplier stock; 0 when the provider is unreachable so we
                // don't advertise availability we can't fulfil.
                const pid = String(typeData.provider_product_id || '');
                stock = abahStockById ? (abahStockById[pid] ?? 0) : 0;
            } else {
                // Local stock: count codes that are NOT used
                const codesSnapshot = await db.collection('redeem_codes')
                    .where('type_id', '==', typeId)
                    .where('is_used', '==', false)
                    .get();
                stock = codesSnapshot.size;
            }

            products.push({
                id: typeId,
                name: typeData.name,
                price: typeData.selling_price,
                sellingPrice: typeData.selling_price,
                capitalPrice: typeData.capital_price,
                category,
                source,
                stock,
                createdAt: typeData.created_at,
            });
        }

        // Sort by created_at desc
        products.sort((a, b) => {
            const aTime = new Date(a.createdAt || 0).getTime();
            const bTime = new Date(b.createdAt || 0).getTime();
            return bTime - aTime;
        });

        cacheSet(CACHE_KEY, products);
        // Persist a never-expiring snapshot for error fallback.
        cacheSet(LKG_KEY, products);

        console.log(`[products/get] fresh database fetch: ${products.length} types`);

        return Response.json({
            success: true,
            data: products,
        });
    } catch (error) {
        console.error('Error fetching products:', error);

        // Database failed (e.g. transient error). Serve the last-known-good snapshot
        // so the store does not falsely show "tutup". Only hard-fail if we have never
        // fetched successfully.
        const lastGood = cachePeek(LKG_KEY);
        if (lastGood !== undefined) {
            console.warn(`[products/get] error-serving-stale: returning last-known-good (${lastGood.length} products)`);
            return Response.json({ success: true, data: lastGood, stale: true });
        }

        return Response.json(
            { success: false, error: 'Failed to load products' },
            { status: 500 }
        );
    }
}
