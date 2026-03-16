import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Simple in-memory rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30;

function isRateLimited(identifier) {
    const now = Date.now();
    const entry = rateLimitMap.get(identifier);

    if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(identifier, { firstAttempt: now, count: 1 });
        return false;
    }

    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
        return true;
    }
    return false;
}

export async function POST(req) {
    try {
        // Get client IP for rate limiting
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
        
        if (isRateLimited(ip)) {
            return NextResponse.json(
                { success: false, message: 'Terlalu banyak permintaan. Coba lagi nanti.' },
                { status: 429 }
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

        const { codeId, force } = body;
        console.log('[Delete Code] Request:', { codeId, force, ip });

        if (!codeId) {
            return NextResponse.json(
                { success: false, message: 'Code ID is required' },
                { status: 400 }
            );
        }

        if (typeof codeId !== 'string') {
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
        console.log('[Delete Code] Code data:', { isUsed: codeData.isUsed, soldTo: codeData.soldTo });

        // Delete using Admin SDK (bypasses security rules)
        // Admin can delete any code, confirmation is handled by frontend AlertDialog
        await adminDb.collection('redeem_codes').doc(codeId).delete();

        console.log(`[Delete Code] Success: ${codeId} (force=${!!force})`);

        return NextResponse.json({
            success: true,
            message: force ? 'Code force deleted successfully' : 'Code deleted successfully'
        });

    } catch (error) {
        console.error('[Delete Code] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete code: ' + error.message },
            { status: 500 }
        );
    }
}
