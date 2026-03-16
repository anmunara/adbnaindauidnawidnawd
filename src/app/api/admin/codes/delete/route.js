import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { adminDb } from '@/lib/firebaseAdmin';

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30;

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

function isAdmin(email) {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    return adminEmails.includes(email);
}

export async function POST(req) {
    try {
        // Rate limiting
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('x-real-ip') || 
                   'unknown';
        if (isRateLimited(ip)) {
            return NextResponse.json(
                { success: false, message: 'Terlalu banyak permintaan. Coba lagi nanti.' },
                { status: 429 }
            );
        }

        // Authentication check
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized. Please login.' },
                { status: 401 }
            );
        }

        // Admin check
        if (!isAdmin(session.user.email)) {
            return NextResponse.json(
                { success: false, message: 'Forbidden. Admin access required.' },
                { status: 403 }
            );
        }

        // Parse body
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json(
                { success: false, message: 'Invalid JSON body' },
                { status: 400 }
            );
        }

        const { codeId } = body;

        console.log(`[Admin Delete Code] Request received:`, { codeId, user: session.user.email });

        // Validation
        if (!codeId) {
            return NextResponse.json(
                { success: false, message: 'Code ID is required' },
                { status: 400 }
            );
        }

        if (typeof codeId !== 'string' || codeId.length < 1 || codeId.length > 100) {
            return NextResponse.json(
                { success: false, message: 'Invalid Code ID format' },
                { status: 400 }
            );
        }

        // Check if code exists
        const codeDoc = await adminDb.collection('redeem_codes').doc(codeId).get();
        if (!codeDoc.exists) {
            return NextResponse.json(
                { success: false, message: 'Code not found' },
                { status: 404 }
            );
        }

        const codeData = codeDoc.data();

        // Prevent deleting already used codes (optional safety)
        if (codeData.isUsed) {
            return NextResponse.json(
                { success: false, message: 'Cannot delete code that has been sold' },
                { status: 400 }
            );
        }

        // Delete using Admin SDK (bypasses security rules)
        await adminDb.collection('redeem_codes').doc(codeId).delete();

        console.log(`[Admin] Code deleted: ${codeId} by ${session.user.email}`);

        return NextResponse.json({
            success: true,
            message: 'Code deleted successfully'
        });

    } catch (error) {
        console.error('Delete code error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete code' },
            { status: 500 }
        );
    }
}
