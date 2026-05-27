import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

function assertLocalhost(req) {
    const host = req.headers.get('host') || '';
    if (!host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    return null;
}

export async function GET(req) {
    const localErr = assertLocalhost(req);
    if (localErr) return localErr;

    try {
        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json({ success: false, message: 'orderId required' }, { status: 400 });
        }

        // Check transactions collection (Discord orders)
        let doc = await adminDb.collection('transactions').doc(orderId).get();
        if (!doc.exists) {
            doc = await adminDb.collection('orders').doc(orderId).get();
        }

        if (!doc.exists) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        const data = doc.data();

        return NextResponse.json({
            success: true,
            order: {
                orderId: data.merchantOrderId || data.orderId,
                itemName: data.itemName,
                price: data.price || data.amount || 0,
                status: data.status,
                delivered: data.delivered || false,
                redeemCode: data.redeemCode || null,
            },
        });
    } catch (error) {
        console.error('[Bot Order Status] Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
