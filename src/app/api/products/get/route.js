import { db } from '@/lib/db';
import { cacheGet, cacheSet, cachePeek } from '@/lib/memoryCache';

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

        const products = [];

        // For each type, count available codes
        for (const typeDoc of typesSnapshot.docs) {
            const typeData = typeDoc.data();
            const typeId = typeDoc.id;

            // Backfill missing category — old products default to 'redfinger'
            let category = typeData.category;
            if (!category) {
                category = 'redfinger';
                await typeDoc.ref.update({ category }).catch(() => {});
            }

            // Count codes that are NOT used
            const codesSnapshot = await db.collection('redeem_codes')
                .where('type_id', '==', typeId)
                .where('is_used', '==', false)
                .get();

            products.push({
                id: typeId,
                name: typeData.name,
                price: typeData.selling_price,
                sellingPrice: typeData.selling_price,
                capitalPrice: typeData.capital_price,
                category,
                stock: codesSnapshot.size, // Available codes count
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
