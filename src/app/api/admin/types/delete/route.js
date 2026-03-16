import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { adminDb } from '@/lib/firebaseAdmin';

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

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

        const { typeId } = body;

        // Validation
        if (!typeId) {
            return NextResponse.json(
                { success: false, message: 'Type ID is required' },
                { status: 400 }
            );
        }

        if (typeof typeId !== 'string' || typeId.length < 5 || typeId.length > 50) {
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
                    message: 'Cannot delete type with unsold codes. Please delete all codes first or they will be orphaned.' 
                },
                { status: 400 }
            );
        }

        // Delete using Admin SDK (bypasses security rules)
        await adminDb.collection('game_types').doc(typeId).delete();

        console.log(`[Admin] Type deleted: ${typeId} (${typeData.name}) by ${session.user.email}`);

        return NextResponse.json({
            success: true,
            message: `Type "${typeData.name}" deleted successfully`
        });

    } catch (error) {
        console.error('Delete type error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete type' },
            { status: 500 }
        );
    }
}
