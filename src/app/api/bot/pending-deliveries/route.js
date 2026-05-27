import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

function assertLocalhost(req) {
    const host = req.headers.get('host') || '';
    if (!host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    return null;
}

// Returns all successful transactions that haven't been delivered yet
export async function GET(req) {
    const localErr = assertLocalhost(req);
    if (localErr) return localErr;

    try {
        const snapshot = await adminDb.collection('transactions')
            .where('status', '==', 'SUCCESS')
            .where('delivered', '==', null)
            .limit(20)
            .get();

        const pending = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            pending.push({
                docId: doc.id,
                userId: data.userId,
                username: data.username,
                itemId: data.itemId,
                itemName: data.itemName,
                merchantOrderId: data.merchantOrderId,
                redeemCode: data.redeemCode || null,
                dmMessageId: data.dmMessageId || null,
                dmChannelId: data.dmChannelId || null,
            });
        });

        return NextResponse.json({ success: true, pending });
    } catch (error) {
        console.error('[Bot Pending Deliveries] Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// Mark a transaction as delivered
export async function POST(req) {
    const localErr = assertLocalhost(req);
    if (localErr) return localErr;

    try {
        const body = await req.json();
        const { docId } = body;

        if (!docId) {
            return NextResponse.json({ success: false, message: 'docId required' }, { status: 400 });
        }

        await adminDb.collection('transactions').doc(docId).update({
            delivered: true,
            deliveredAt: new Date(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Bot Mark Delivered] Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
