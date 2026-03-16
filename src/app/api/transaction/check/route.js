import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
        return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    try {
        // Check both collections (website 'orders' + Discord 'transactions')
        let doc = await adminDb.collection('orders').doc(orderId).get();

        if (!doc.exists) {
            doc = await adminDb.collection('transactions').doc(orderId).get();
        }

        if (!doc.exists) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        const data = doc.data();

        return NextResponse.json({
            success: true,
            order: {
                orderId: data.orderId || data.merchantOrderId,
                itemName: data.itemName,
                price: data.price || data.amount,
                status: data.status,
                paymentMethod: data.paymentMethod,
                qrString: data.qrString || null,
                vaNumber: data.vaNumber || null,
                paymentUrl: data.paymentUrl || null,
                expiryTime: data.expiryTime || null,
                redeemCode: data.status === 'SUCCESS' ? (data.redeemCode || null) : null,
                createdAt: data.createdAt
            }
        });

    } catch (error) {
        console.error('Order Fetch Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
