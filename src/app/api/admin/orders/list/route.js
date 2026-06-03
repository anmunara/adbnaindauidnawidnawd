import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin } from '@/lib/admin-auth';
import { cacheGet, cacheSet } from '@/lib/memoryCache';

// This endpoint returns real document data and is polled by the admin orders
// table. Bound the scan with a default limit (newest-first) and cache briefly.
// Pass ?fresh=1 to bypass the cache and ?limit=N to widen the window.
const ORDERS_LIST_TTL_MS = 20 * 1000;
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;

function toIso(v) {
    if (!v) return null;
    if (typeof v === 'string') return v;
    if (v.toDate) return v.toDate().toISOString();
    if (v.seconds) return new Date(v.seconds * 1000).toISOString();
    if (v instanceof Date) return v.toISOString();
    return null;
}

export async function GET(req) {
    const auth = await requireAdmin();
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    try {
        const url = new URL(req.url);
        const fresh = url.searchParams.get('fresh') === '1';
        const limit = Math.min(
            Math.max(parseInt(url.searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
            MAX_LIMIT
        );

        const cacheKey = `admin:orders:list:${limit}`;
        if (!fresh) {
            const cached = cacheGet(cacheKey, ORDERS_LIST_TTL_MS);
            if (cached !== undefined) {
                return NextResponse.json({ success: true, data: cached });
            }
        }

        const [ordersSnap, transactionsSnap, typesSnap] = await Promise.all([
            adminDb.collection('orders').orderBy('createdAt', 'desc').limit(limit).get(),
            adminDb.collection('transactions').orderBy('createdAt', 'desc').limit(limit).get(),
            adminDb.collection('game_types').get(),
        ]);

        const typeMap = {};
        typesSnap.docs.forEach((d) => {
            const data = d.data();
            typeMap[d.id] = {
                name: data.name || 'Unknown',
                sellingPrice: Number(data.sellingPrice) || 0,
            };
        });

        const normalize = (d, source) => {
            const data = d.data();
            const itemId = data.itemId || data.typeId || null;
            let price = Number(data.price) || Number(data.amount) || 0;
            if (!price && itemId && typeMap[itemId]) {
                price = typeMap[itemId].sellingPrice;
            }
            return {
                id: d.id,
                source,
                orderId: data.orderId || d.id,
                userId: data.userId || data.username || null,
                userEmail: data.userEmail || null,
                itemId,
                itemName: data.itemName || data.productName || (itemId && typeMap[itemId]?.name) || 'Unknown',
                price,
                paymentMethod: data.paymentMethod || null,
                status: (data.status || 'PENDING').toUpperCase(),
                redeemCode: data.redeemCode || data.code || null,
                reference: data.reference || data.duitkuReference || null,
                createdAt: toIso(data.createdAt),
                paidAt: toIso(data.paidAt),
                updatedAt: toIso(data.updatedAt),
            };
        };

        const orders = [
            ...ordersSnap.docs.map((d) => normalize(d, 'orders')),
            ...transactionsSnap.docs.map((d) => normalize(d, 'transactions')),
        ];

        orders.sort((a, b) => {
            const aTime = new Date(a.createdAt || a.paidAt || 0).getTime();
            const bTime = new Date(b.createdAt || b.paidAt || 0).getTime();
            return bTime - aTime;
        });

        // The two collections were each limited; trim the merged result so the
        // window stays consistent regardless of how rows split between them.
        const data = orders.slice(0, limit);

        cacheSet(cacheKey, data);

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('[Orders List] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to load orders' },
            { status: 500 }
        );
    }
}
