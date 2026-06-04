import { adminDb } from '@/lib/firebaseAdmin';
import { cacheGet, cacheSet, cachePeek } from '@/lib/memoryCache';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // No CDN/page cache; we manage freshness in-process

const CACHE_KEY = 'products:get';
// Long-lived "last known good" snapshot, never auto-expires. Served on Firestore
// errors (e.g. RESOURCE_EXHAUSTED quota) so the store doesn't falsely show "tutup".
const LKG_KEY = 'products:get:lastGood';
const CACHE_TTL_MS = 300_000; // 300s — 5 min, cuts Firestore reads heavily; stock is also refreshed right after each delivery

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

        // Fetch all game types using Admin SDK (always fresh from server)
        const typesSnapshot = await adminDb.collection('game_types').orderBy('createdAt', 'desc').get();

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

            // Count codes that are NOT used using Firestore aggregation.
            // count().get() bills ~1 read per 1000 matched docs instead of 1 read
            // per doc, so this no longer scales with inventory size.
            // NOTE: the two equality filters below (typeId == x AND isUsed == false)
            // require a Firestore COMPOSITE INDEX on collection `redeem_codes`:
            //   fields: typeId ASC, isUsed ASC
            // Without it the query throws FAILED_PRECONDITION and the store shows "tutup".
            const countSnapshot = await adminDb.collection('redeem_codes')
                .where('typeId', '==', typeId)
                .where('isUsed', '==', false)
                .count()
                .get();

            products.push({
                id: typeId,
                name: typeData.name,
                price: typeData.sellingPrice,
                sellingPrice: typeData.sellingPrice,
                capitalPrice: typeData.capitalPrice,
                category,
                stock: countSnapshot.data().count, // Available codes count
                createdAt: typeData.createdAt,
            });
        }

        cacheSet(CACHE_KEY, products);
        // Persist a never-expiring snapshot for error fallback.
        cacheSet(LKG_KEY, products);

        console.log(`[products/get] fresh Firestore fetch: ${products.length} types (stock via count() aggregation)`);

        return Response.json({
            success: true,
            data: products,
        });
    } catch (error) {
        console.error('Error fetching products:', error);

        // Firestore failed (e.g. RESOURCE_EXHAUSTED quota, missing index, transient
        // network error). Serve the last-known-good snapshot so the store does not
        // falsely show "tutup". Only hard-fail if we have never fetched successfully.
        const lastGood = cachePeek(LKG_KEY);
        if (lastGood !== undefined) {
            console.warn(`[products/get] error-serving-stale: returning last-known-good (${lastGood.length} products)`);
            return Response.json({ success: true, data: lastGood, stale: true });
        }

        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
