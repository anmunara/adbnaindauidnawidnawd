import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assertBotSecret } from '@/lib/security';

// Returns all successful transactions that haven't been delivered yet
export async function GET(req) {
    const authErr = assertBotSecret(req);
    if (authErr) return authErr;

    try {
        const snapshot = await db.collection('transactions')
            .where('status', '==', 'SUCCESS')
            .where('delivered', '==', false)
            .limit(20)
            .get();

        const pending = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            pending.push({
                docId: doc.id,
                userId: data.user_id,
                username: data.username,
                itemId: data.item_id,
                itemName: data.item_name,
                merchantOrderId: data.order_id,
                redeemCode: data.redeem_code || null,
                dmMessageId: data.dm_message_id || null,
                dmChannelId: data.dm_channel_id || null,
            });
        });

        return NextResponse.json({ success: true, pending });
    } catch (error) {
        console.error('[Bot Pending Deliveries] Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to load pending deliveries' }, { status: 500 });
    }
}

// Mark a transaction as delivered
export async function POST(req) {
    const authErr = assertBotSecret(req);
    if (authErr) return authErr;

    try {
        const body = await req.json();
        const { docId } = body;

        if (!docId) {
            return NextResponse.json({ success: false, message: 'docId required' }, { status: 400 });
        }

        await db.collection('transactions').doc(docId).update({
            delivered: true,
            delivered_at: new Date().toISOString(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Bot Mark Delivered] Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to mark delivered' }, { status: 500 });
    }
}
