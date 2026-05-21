import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { adminDb } from '@/lib/firebaseAdmin';

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 15; // 15 checks per minute (was 30 — tightened to limit brute-force scanning)

function isRateLimited(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { firstAttempt: now, count: 1 });
        return false;
    }

    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
        return true;
    }
    return false;
}

export async function GET(request) {
    try {
        // Rate limiting
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
        if (isRateLimited(ip)) {
            return NextResponse.json(
                { success: false, message: 'Terlalu banyak permintaan. Coba lagi nanti.' },
                { status: 429 }
            );
        }

        // Authentication check
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized. Please login.' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json(
                { success: false, message: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Validate orderId format (prevent injection + cap length)
        if (!/^TRX-[0-9]{10,16}-[0-9a-zA-Z]{4,16}$/.test(orderId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid Order ID format' },
                { status: 400 }
            );
        }

        // Check both collections (website 'orders' + Discord 'transactions')
        let doc = await adminDb.collection('orders').doc(orderId).get();
        let collectionName = 'orders';

        if (!doc.exists) {
            doc = await adminDb.collection('transactions').doc(orderId).get();
            collectionName = 'transactions';
        }

        if (!doc.exists) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        const data = doc.data();

        // Authorization check - verify order belongs to current user
        // Allow if user is the owner OR if user is admin
        const isOwner = data.userId === session.user.id || 
                       data.userId === session.user.email;
        
        // Check admin status
        const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
        const isAdmin = adminEmails.includes(session.user.email);

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { success: false, message: 'Forbidden. You do not have access to this order.' },
                { status: 403 }
            );
        }

        // Sanitize response - only return necessary fields
        const sanitizedOrder = {
            orderId: data.orderId || data.merchantOrderId,
            itemName: data.itemName,
            price: data.price || data.amount,
            status: data.status,
            paymentMethod: data.paymentMethod,
            qrString: data.qrString || null,
            vaNumber: data.vaNumber || null,
            paymentUrl: data.paymentUrl || null,
            expiryTime: data.expiryTime || null,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt || null,
            paidAt: data.paidAt || null,
        };

        // Only include redeem code if payment is successful
        if (data.status === 'SUCCESS') {
            sanitizedOrder.redeemCode = data.redeemCode || null;
        }

        return NextResponse.json({
            success: true,
            order: sanitizedOrder
        });

    } catch (error) {
        console.error('Order Fetch Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
