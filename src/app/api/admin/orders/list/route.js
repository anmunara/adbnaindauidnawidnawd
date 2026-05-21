import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin } from '@/lib/admin-auth';

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
        const [ordersSnap, transactionsSnap, typesSnap] = await Promise.all([
            adminDb.collection('orders').get(),
            adminDb.collection('transactions').get(),
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

        return NextResponse.json({ success: true, data: orders });
    } catch (error) {
        console.error('[Orders List] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to load orders' },
            { status: 500 }
        );
    }
}
