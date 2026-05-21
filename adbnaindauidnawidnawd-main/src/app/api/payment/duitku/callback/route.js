import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

// Ensure Firebase Admin is initialized
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch (error) {
        console.error('Firebase admin init error:', error);
    }
}

const db = adminDb || admin.firestore();

export async function POST(req) {
    try {
        const contentType = req.headers.get('content-type') || '';
        let body;

        // Duitku sends x-www-form-urlencoded
        if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData();
            body = Object.fromEntries(formData.entries());
        } else {
            body = await req.json();
        }

        const { merchantCode, amount, merchantOrderId, signature, resultCode, reference } = body;

        // 1. Verify Signature
        const apiKey = process.env.DUITKU_API_KEY;
        const calcSignature = crypto.createHash('md5')
            .update(`${merchantCode}${amount}${merchantOrderId}${apiKey}`)
            .digest('hex');

        if (calcSignature !== signature) {
            return NextResponse.json({ message: 'Invalid Signature' }, { status: 400 });
        }

        // 2. Find order - check BOTH collections (website uses 'orders', Discord uses 'transactions')
        let orderRef = null;
        let orderDoc = null;
        let orderData = null;
        let orderSource = null; // 'orders' or 'transactions'

        // Try 'orders' collection first (website orders)
        orderRef = db.collection('orders').doc(merchantOrderId);
        orderDoc = await orderRef.get();

        if (orderDoc.exists) {
            orderData = orderDoc.data();
            orderSource = 'orders';
            console.log(`[Callback] Found order in 'orders' collection: ${merchantOrderId}`);
        } else {
            // Try 'transactions' collection (Discord bot orders)
            orderRef = db.collection('transactions').doc(merchantOrderId);
            orderDoc = await orderRef.get();

            if (orderDoc.exists) {
                orderData = orderDoc.data();
                orderSource = 'transactions';
                console.log(`[Callback] Found order in 'transactions' collection: ${merchantOrderId}`);
            }
        }

        if (!orderData) {
            console.error('[Callback] Order not found in any collection:', merchantOrderId);
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        // 3. Handle Payment Status
        if (resultCode === '00') { // 00 = Success
            if (orderData.status === 'SUCCESS') {
                return NextResponse.json({ message: 'Already Paid' }, { status: 200 });
            }

            // Allocate code AFTER payment success (same flow for Website & Discord)
            let assignedCode = 'STOCK_EMPTY_PLEASE_CONTACT_ADMIN';
            const itemId = orderData.itemId;
            const source = orderSource === 'orders' ? 'Website' : 'Discord';
            const userName = orderData.username || orderData.userId || 'Unknown';

            const codesRef = db.collection('redeem_codes');
            const codeSnapshot = await codesRef
                .where('typeId', '==', itemId)
                .where('isUsed', '==', false)
                .limit(1)
                .get();

            if (!codeSnapshot.empty) {
                const codeDoc = codeSnapshot.docs[0];
                assignedCode = codeDoc.data().code;

                const saleTimestamp = new Date().toISOString();
                const note = `Terjual via ${source} | User: ${userName} | Ref: ${reference} | Order: ${merchantOrderId} | Waktu: ${saleTimestamp}`;

                await codeDoc.ref.update({
                    isUsed: true,
                    soldTo: orderData.userId || 'unknown',
                    transactionId: merchantOrderId,
                    note: note,
                    soldAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                console.log(`[Callback] Code sold via ${source}:`, { code: assignedCode, soldTo: orderData.userId, note });
            } else {
                console.warn('[Callback] No stock available for itemId:', itemId);
            }

            // Update order/transaction
            await orderRef.update({
                status: 'SUCCESS',
                duitkuReference: reference,
                redeemCode: assignedCode,
                paidAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: new Date().toISOString()
            });

            console.log(`[Callback] Order ${merchantOrderId} SUCCESS (${source}) - Code: ${assignedCode}`);
            return NextResponse.json({ message: 'Success' }, { status: 200 });

        } else {
            // Payment Failed or Expired - just update status
            await orderRef.update({
                status: 'FAILED',
                resultCode: resultCode,
                failedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: new Date().toISOString()
            });

            console.log(`[Callback] Order ${merchantOrderId} FAILED (${orderSource}) - resultCode: ${resultCode}`);
            return NextResponse.json({ message: 'Payment Failed' }, { status: 200 });
        }

    } catch (error) {
        console.error('Duitku Callback Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
