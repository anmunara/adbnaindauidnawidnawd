import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { assertSameOrigin, isValidDocId } from '@/lib/security';

export async function POST(req) {
    const originErr = assertSameOrigin(req);
    if (originErr) return originErr;

    const auth = await requireAdmin();
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    try {
        const body = await req.json();
        const { typeIds } = body || {};

        if (!Array.isArray(typeIds) || typeIds.length === 0) {
            return NextResponse.json({ success: false, message: 'typeIds required' }, { status: 400 });
        }
        if (typeIds.length > 50) {
            return NextResponse.json({ success: false, message: 'Max 50 per batch' }, { status: 400 });
        }

        let deleted = 0;
        let skippedWithCodes = 0;
        for (const typeId of typeIds) {
            if (!isValidDocId(typeId)) continue;
            const codesSnap = await db.collection('redeem_codes')
                .where('type_id', '==', typeId)
                .limit(1)
                .get();
            if (!codesSnap.empty) {
                skippedWithCodes += 1;
                continue;
            }
            await db.collection('game_types').doc(typeId).delete();
            deleted += 1;
        }

        return NextResponse.json({ success: true, deleted, skippedWithCodes });
    } catch (error) {
        console.error('[Types Bulk Delete] Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
    }
}
