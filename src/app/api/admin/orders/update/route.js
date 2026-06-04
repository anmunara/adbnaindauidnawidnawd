import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { assertSameOrigin } from '@/lib/security';

const ALLOWED_STATUSES = ['PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'REFUNDED'];
const MAX_PRICE = 100_000_000;

export async function POST(req) {
    const originErr = assertSameOrigin(req);
    if (originErr) return originErr;

    const auth = await requireAdmin();
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    try {
        const body = await req.json();
        const { orderId, source, status, redeemCode, userId, itemName, price } = body || {};

        if (!orderId || typeof orderId !== 'string' || orderId.length > 64) {
            return NextResponse.json({ success: false, message: 'Invalid orderId' }, { status: 400 });
        }
        if (!['orders', 'transactions'].includes(source)) {
            return NextResponse.json({ success: false, message: 'Invalid source' }, { status: 400 });
        }

        const ref = db.collection(source).doc(orderId);
        const snap = await ref.get();
        if (!snap.exists) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        const updates = { updated_at: new Date().toISOString() };
        if (status) {
            const normalized = String(status).toUpperCase();
            if (!ALLOWED_STATUSES.includes(normalized)) {
                return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
            }
            updates.status = normalized;
            if (normalized === 'SUCCESS' && !snap.data().paid_at) {
                updates.paid_at = new Date().toISOString();
            }
        }
        if (typeof redeemCode === 'string' && redeemCode.length <= 200) {
            updates.redeem_code = redeemCode;
        }
        if (typeof userId === 'string' && userId.length <= 100) {
            updates.user_id = userId;
        }
        if (typeof itemName === 'string' && itemName.length <= 100) {
            updates.item_name = itemName;
        }
        if (typeof price === 'number' && price >= 0 && price <= MAX_PRICE) {
            updates.price = Math.floor(price);
        }

        await ref.update(updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Order Update] Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
    }
}
