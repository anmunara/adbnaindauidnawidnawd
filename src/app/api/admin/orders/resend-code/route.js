import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { assertSameOrigin, maskCode } from '@/lib/security';

export async function POST(req) {
    const originErr = assertSameOrigin(req);
    if (originErr) return originErr;

    const auth = await requireAdmin();
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    try {
        const body = await req.json();
        const { orderId, source } = body || {};

        if (typeof orderId !== 'string' || orderId.length > 64) {
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
        const order = snap.data();
        const itemId = order.item_id || order.type_id;
        if (!itemId) {
            return NextResponse.json({ success: false, message: 'Order missing itemId' }, { status: 400 });
        }

        // Atomic allocation via transaction (race-safe like the duitku callback)
        let allocatedCode = null;
        try {
            allocatedCode = await db.runTransaction(async (tx) => {
                const candidateSnap = await db.collection('redeem_codes')
                    .where('type_id', '==', itemId)
                    .where('is_used', '==', false)
                    .limit(5)
                    .get();

                for (const cand of candidateSnap.docs) {
                    const fresh = await tx.get(cand.ref);
                    if (fresh.exists && fresh.data().is_used === false) {
                        const now = new Date().toISOString();
                        tx.update(cand.ref, {
                            is_used: true,
                            sold_to: order.user_id || 'unknown',
                            transaction_id: orderId,
                            note: `Manual resend by admin | Order: ${orderId} | Waktu: ${now}`,
                            sold_at: now,
                            updated_at: now,
                        });
                        return fresh.data().code;
                    }
                }
                return null;
            });
        } catch (txErr) {
            console.error('[Resend Code] Allocation tx failed:', txErr);
        }

        if (!allocatedCode) {
            return NextResponse.json({ success: false, message: 'Stok kosong untuk produk ini' }, { status: 400 });
        }

        // Preserve original paidAt — only set if order was already paid.
        // Don't fabricate paidAt during admin resend (misleading audit trail).
        const orderUpdates = {
            redeem_code: allocatedCode,
            status: 'SUCCESS',
            updated_at: new Date().toISOString(),
        };
        if (!order.paid_at) {
            orderUpdates.resent_at = new Date().toISOString();
        }
        await ref.update(orderUpdates);

        console.log(`[Resend Code] Order ${orderId} - Code: ${maskCode(allocatedCode)}`);
        return NextResponse.json({ success: true, code: allocatedCode });
    } catch (error) {
        console.error('[Resend Code] Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to resend code' }, { status: 500 });
    }
}
