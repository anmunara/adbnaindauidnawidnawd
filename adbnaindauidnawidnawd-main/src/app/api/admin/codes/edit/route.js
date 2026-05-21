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

        const { codeId, code, note } = body;
        console.log('[Edit Code] Request:', { codeId, code, note });

        if (!codeId || typeof codeId !== 'string') {
            return NextResponse.json(
                { success: false, message: 'Code ID is required' },
                { status: 400 }
            );
        }

        if (!code || typeof code !== 'string' || code.trim() === '') {
            return NextResponse.json(
                { success: false, message: 'Code is required' },
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

        // Update using Admin SDK
        await adminDb.collection('redeem_codes').doc(codeId).update({
            code: code.trim(),
            note: note || '',
            updatedAt: new Date()
        });

        console.log(`[Edit Code] Success: ${codeId}`);

        return NextResponse.json({
            success: true,
            message: 'Code updated successfully'
        });

    } catch (error) {
        console.error('[Edit Code] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update code: ' + error.message },
            { status: 500 }
        );
    }
}
