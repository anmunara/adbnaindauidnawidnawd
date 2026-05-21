import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Simple in-memory rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 30;

function isRateLimited(identifier) {
    const now = Date.now();
    const entry = rateLimitMap.get(identifier);
    if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(identifier, { firstAttempt: now, count: 1 });
        return false;
    }
    entry.count++;
    return entry.count > RATE_LIMIT_MAX;
}

export async function POST(req) {
    try {
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
        
        if (isRateLimited(ip)) {
            return NextResponse.json(
                { success: false, message: 'Terlalu banyak permintaan.' },
                { status: 429 }
            );
        }

        let body;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json(
                { success: false, message: 'Invalid JSON body' },
                { status: 400 }
            );
        }

        const { name, sellingPrice, capitalPrice } = body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json(
                { success: false, message: 'Type name is required' },
                { status: 400 }
            );
        }

        const docRef = await adminDb.collection('game_types').add({
            name: name.trim(),
            sellingPrice: parseFloat(sellingPrice) || 0,
            capitalPrice: parseFloat(capitalPrice) || 0,
            createdAt: new Date()
        });

        console.log(`[Add Type] Success: ${docRef.id}`);

        return NextResponse.json({
            success: true,
            message: 'Type added successfully',
            typeId: docRef.id
        });

    } catch (error) {
        console.error('[Add Type] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to add type: ' + error.message },
            { status: 500 }
        );
    }
}
