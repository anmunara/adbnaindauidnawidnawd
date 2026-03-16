import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Simple in-memory rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

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

        const { typeId } = body;
        console.log('[Delete Type] Request:', { typeId, ip });

        if (!typeId) {
            return NextResponse.json(
                { success: false, message: 'Type ID is required' },
                { status: 400 }
            );
        }

        if (typeof typeId !== 'string') {
            return NextResponse.json(
                { success: false, message: 'Invalid Type ID format' },
                { status: 400 }
            );
        }

        // Check if type exists
        const typeDoc = await adminDb.collection('game_types').doc(typeId).get();
        if (!typeDoc.exists) {
            return NextResponse.json(
                { success: false, message: 'Type not found' },
                { status: 404 }
            );
        }

        const typeData = typeDoc.data();

        // Check if there are any unsold codes for this type
        const codesSnapshot = await adminDb.collection('redeem_codes')
            .where('typeId', '==', typeId)
            .where('isUsed', '==', false)
            .limit(1)
            .get();

        if (!codesSnapshot.empty) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Cannot delete type with unsold codes. Please delete all codes first.' 
                },
                { status: 400 }
            );
        }

        // Delete using Admin SDK
        await adminDb.collection('game_types').doc(typeId).delete();

        console.log(`[Delete Type] Success: ${typeId}`);

        return NextResponse.json({
            success: true,
            message: `Type "${typeData.name}" deleted successfully`
        });

    } catch (error) {
        console.error('[Delete Type] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete type: ' + error.message },
            { status: 500 }
        );
    }
}
