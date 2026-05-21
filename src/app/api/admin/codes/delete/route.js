import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
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
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
        }

        const { codeId } = body;

        if (!isValidDocId(codeId)) {
            return NextResponse.json({ success: false, message: 'Invalid code ID' }, { status: 400 });
        }

        const codeRef = adminDb.collection('redeem_codes').doc(codeId);
        const codeDoc = await codeRef.get();
        if (!codeDoc.exists) {
            return NextResponse.json({ success: false, message: 'Code not found' }, { status: 404 });
        }

        await codeRef.delete();

        return NextResponse.json({ success: true, message: 'Code deleted successfully' });
    } catch (error) {
        console.error('[Delete Code] Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete code' }, { status: 500 });
    }
}
