import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
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

        const ref = adminDb.collection(source).doc(orderId);
        const snap = await ref.get();
        if (!snap.exists) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }
        const order = snap.data();
        if (!order.itemId) {
            return NextResponse.json({ success: false, message: 'Order missing itemId' }, { status: 400 });
        }

        // Atomic allocation via transaction (race-safe like the duitku callback)
        let allocatedCode = null;
        try {
            allocatedCode = await adminDb.runTransaction(async (tx) => {
                const candidateSnap = await adminDb.collection('redeem_codes')
                    .where('typeId', '==', order.itemId)
                    .where('isUsed', '==', false)
                    .limit(5)
                    .get();

                for (const cand of candidateSnap.docs) {
                    const fresh = await tx.get(cand.ref);
                    if (fresh.exists && fresh.data().isUsed === false) {
                        const now = new Date();
                        tx.update(cand.ref, {
                            isUsed: true,
                            soldTo: order.userId || 'unknown',
                            transactionId: orderId,
                            note: `Manual resend by admin | Order: ${orderId} | Waktu: ${now.toISOString()}`,
                            soldAt: now,
                            updatedAt: now,
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
            redeemCode: allocatedCode,
            status: 'SUCCESS',
            updatedAt: new Date().toISOString(),
        };
        if (!order.paidAt) {
            orderUpdates.resentAt = new Date().toISOString();
        }
        await ref.update(orderUpdates);

        console.log(`[Resend Code] Order ${orderId} - Code: ${maskCode(allocatedCode)}`);
        return NextResponse.json({ success: true, code: allocatedCode });
    } catch (error) {
        console.error('[Resend Code] Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to resend code' }, { status: 500 });
    }
}
