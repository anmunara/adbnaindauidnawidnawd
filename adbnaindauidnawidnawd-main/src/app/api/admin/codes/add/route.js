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

        const { codes, typeId, note } = body;
        console.log('[Add Code] Request:', { codesCount: codes?.length, typeId, note });

        if (!codes || !Array.isArray(codes) || codes.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Codes array is required' },
                { status: 400 }
            );
        }

        if (!typeId || typeof typeId !== 'string') {
            return NextResponse.json(
                { success: false, message: 'Type ID is required' },
                { status: 400 }
            );
        }

        // Verify type exists
        const typeDoc = await adminDb.collection('game_types').doc(typeId).get();
        if (!typeDoc.exists) {
            return NextResponse.json(
                { success: false, message: 'Type not found' },
                { status: 404 }
            );
        }

        // Add all codes using Admin SDK
        const batch = adminDb.batch();
        const addedCodes = [];

        for (const code of codes) {
            if (!code || typeof code !== 'string' || code.trim() === '') continue;
            
            const codeRef = adminDb.collection('redeem_codes').doc();
            batch.set(codeRef, {
                code: code.trim(),
                typeId: typeId,
                note: note || '',
                isUsed: false,
                createdAt: new Date(),
            });
            addedCodes.push(code.trim());
        }

        await batch.commit();

        console.log(`[Add Code] Success: ${addedCodes.length} codes added to type ${typeId}`);

        return NextResponse.json({
            success: true,
            message: `${addedCodes.length} code(s) added successfully`,
            addedCount: addedCodes.length
        });

    } catch (error) {
        console.error('[Add Code] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to add codes: ' + error.message },
            { status: 500 }
        );
    }
}
