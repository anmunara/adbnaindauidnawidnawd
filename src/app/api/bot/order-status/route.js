import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assertBotSecret } from '@/lib/security';

export async function GET(req) {
    const authErr = assertBotSecret(req);
    if (authErr) return authErr;

    try {
        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json({ success: false, message: 'orderId required' }, { status: 400 });
        }

        // Check transactions collection (Discord orders) first, then orders
        let doc = await db.collection('transactions').doc(orderId).get();
        if (!doc.exists) {
            doc = await db.collection('orders').doc(orderId).get();
        }

        if (!doc.exists) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        const data = doc.data();

        return NextResponse.json({
            success: true,
            order: {
                orderId: data.order_id,
                itemName: data.item_name,
                price: data.price || data.amount || 0,
                status: data.status,
                delivered: data.delivered || false,
                redeemCode: data.redeem_code || null,
            },
        });
    } catch (error) {
        console.error('[Bot Order Status] Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to load order status' }, { status: 500 });
    }
}
