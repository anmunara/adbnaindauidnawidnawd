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
        const { codeIds } = body || {};

        if (!Array.isArray(codeIds) || codeIds.length === 0) {
            return NextResponse.json({ success: false, message: 'codeIds required' }, { status: 400 });
        }
        if (codeIds.length > 500) {
            return NextResponse.json({ success: false, message: 'Max 500 per batch' }, { status: 400 });
        }

        let queued = 0;
        for (const id of codeIds) {
            if (!isValidDocId(id)) continue;
            await db.collection('redeem_codes').doc(id).delete();
            queued += 1;
        }

        return NextResponse.json({ success: true, deleted: queued });
    } catch (error) {
        console.error('[Codes Bulk Delete] Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
    }
}
