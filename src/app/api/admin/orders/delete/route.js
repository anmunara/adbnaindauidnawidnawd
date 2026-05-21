import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin } from '@/lib/admin-auth';
import { assertSameOrigin } from '@/lib/security';

export async function POST(req) {
    const originErr = assertSameOrigin(req);
    if (originErr) return originErr;

    const auth = await requireAdmin();
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    try {
        const body = await req.json();
        const { orderIds } = body || {};

        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ success: false, message: 'orderIds array required' }, { status: 400 });
        }
        if (orderIds.length > 100) {
            return NextResponse.json({ success: false, message: 'Max 100 per batch' }, { status: 400 });
        }

        const batch = adminDb.batch();
        let deleted = 0;
        for (const entry of orderIds) {
            const { id, source } = entry || {};
            if (typeof id !== 'string' || id.length > 64) continue;
            if (!['orders', 'transactions'].includes(source)) continue;
            batch.delete(adminDb.collection(source).doc(id));
            deleted += 1;
        }

        await batch.commit();
        return NextResponse.json({ success: true, deleted });
    } catch (error) {
        console.error('[Order Delete] Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
    }
}
