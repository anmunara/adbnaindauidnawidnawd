import { adminDb } from '@/lib/firebaseAdmin';
import { cacheGet, cacheSet } from '@/lib/memoryCache';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // No CDN/page cache; we manage freshness in-process

const CACHE_KEY = 'products:get';
const CACHE_TTL_MS = 10_000; // 10s — absorbs the bot's 15s polling

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const fresh = url.searchParams.get('fresh') === '1';

        // Serve from short-lived in-memory cache unless ?fresh=1 is passed.
        if (!fresh) {
            const cached = cacheGet(CACHE_KEY, CACHE_TTL_MS);
            if (cached !== undefined) {
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

        return Response.json({
            success: true,
            data: products,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
