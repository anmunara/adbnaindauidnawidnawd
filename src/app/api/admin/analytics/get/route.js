import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin } from '@/lib/admin-auth';

function toDate(v) {
    if (!v) return null;
    if (v.toDate) return v.toDate();
    if (typeof v === 'string') {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
    }
    if (typeof v === 'number') return new Date(v);
    if (v?.seconds) return new Date(v.seconds * 1000);
    if (v?._seconds) return new Date(v._seconds * 1000);
    return null;
}

function dayKey(d) {
    return d.toISOString().slice(0, 10);
}

export async function GET(req) {
    const auth = await requireAdmin();
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    try {
        const url = new URL(req.url);
        const days = Math.min(parseInt(url.searchParams.get('days') || '14', 10), 90);

        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - (days - 1));
        startDate.setHours(0, 0, 0, 0);

        const [ordersSnap, transactionsSnap, typesSnap, codesAvailableSnap, codesUsedSnap, usersCountSnap] = await Promise.all([
            adminDb.collection('orders').get(),
            adminDb.collection('transactions').get(),
            adminDb.collection('game_types').get(),
            // Code inventory is only ever COUNTED, never read field-by-field —
            // use aggregation (~1 read per 1000 docs) instead of full scans.
            adminDb.collection('redeem_codes').where('isUsed', '==', false).count().get(),
            adminDb.collection('redeem_codes').where('isUsed', '==', true).count().get(),
            adminDb.collection('users').count().get().catch(() => ({ data: () => ({ count: 0 }) })),
        ]);

        // Build type lookup map: typeId -> { name, sellingPrice }
        const typeMap = {};
        typesSnap.docs.forEach((d) => {
            const data = d.data();
            typeMap[d.id] = {
                name: data.name || 'Unknown',
                sellingPrice: Number(data.sellingPrice) || 0,
            };
        });

        const allOrders = [
            ...ordersSnap.docs.map((d) => ({ id: d.id, source: 'orders', ...d.data() })),
            ...transactionsSnap.docs.map((d) => ({ id: d.id, source: 'transactions', ...d.data() })),
        ];

        // Build daily buckets
        const buckets = {};
        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            buckets[dayKey(d)] = { date: dayKey(d), revenue: 0, count: 0, success: 0, pending: 0, failed: 0 };
        }

        let totalRevenue = 0;
        let successCount = 0;
        let pendingCount = 0;
        let failedCount = 0;
        const typeRevenue = {};
        const uniqueCustomers = new Set();

        for (const o of allOrders) {
            const created = toDate(o.paidAt) || toDate(o.createdAt) || toDate(o.updatedAt);
            const status = (o.status || '').toUpperCase();

            // Multi-field price fallback: price (web) → amount (Discord) → game_types lookup
            const tid = o.itemId || o.typeId || null;
            let price = Number(o.price) || Number(o.amount) || 0;
            if (!price && tid && typeMap[tid]) {
                price = typeMap[tid].sellingPrice;
            }

            const userKey = o.userId || o.username || o.userEmail;

            if (status === 'SUCCESS') {
                totalRevenue += price;
                successCount += 1;
                if (userKey) uniqueCustomers.add(String(userKey));

                const key = tid || 'unknown';
                const typeName = (tid && typeMap[tid]?.name) || o.itemName || o.productName || 'Unknown';
                if (!typeRevenue[key]) typeRevenue[key] = { revenue: 0, count: 0, name: typeName };
                typeRevenue[key].revenue += price;
                typeRevenue[key].count += 1;
            } else if (status === 'PENDING') {
                pendingCount += 1;
            } else if (status === 'FAILED' || status === 'EXPIRED') {
                failedCount += 1;
            }

            if (created && created >= startDate) {
                const key = dayKey(created);
                if (buckets[key]) {
                    if (status === 'SUCCESS') {
                        buckets[key].revenue += price;
                        buckets[key].success += 1;
                    } else if (status === 'PENDING') {
                        buckets[key].pending += 1;
                    } else if (status === 'FAILED' || status === 'EXPIRED') {
                        buckets[key].failed += 1;
                    }
                    buckets[key].count += 1;
                }
            }
        }

        // Top products
        const topProducts = Object.entries(typeRevenue)
            .map(([id, v]) => ({ id, ...v }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Code inventory (from aggregation counts)
        const codesAvailable = codesAvailableSnap.data().count;
        const codesUsed = codesUsedSnap.data().count;

        const daily = Object.values(buckets);

        // Half-period vs previous half for delta
        const half = Math.floor(days / 2);
        const currentHalf = daily.slice(daily.length - half);
        const prevHalf = daily.slice(daily.length - days, daily.length - half);
        const sum = (arr, key) => arr.reduce((acc, x) => acc + (x[key] || 0), 0);
        const prevSum = sum(prevHalf, 'revenue');
        const currSum = sum(currentHalf, 'revenue');
        const revenueDelta = prevSum > 0 ? ((currSum - prevSum) / prevSum) * 100 : (currSum > 0 ? 100 : 0);

        // Prefer unique customer count derived from orders; fallback to users collection size
        const customersCount = uniqueCustomers.size || usersCountSnap.data().count || 0;

        return NextResponse.json({
            success: true,
            data: {
                totalRevenue,
                successCount,
                pendingCount,
                failedCount,
                ordersTotal: allOrders.length,
                avgOrder: successCount > 0 ? Math.round(totalRevenue / successCount) : 0,
                typesCount: typesSnap.size,
                codesAvailable,
                codesUsed,
                customersCount,
                revenueDelta: Number.isFinite(revenueDelta) ? revenueDelta : 0,
                daily,
                topProducts,
            },
        });
    } catch (error) {
        console.error('[Analytics] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to load analytics' },
            { status: 500 }
        );
    }
}
