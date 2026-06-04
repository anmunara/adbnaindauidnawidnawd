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
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
        }

        const { codeId, code, note } = body;

        if (!isValidDocId(codeId)) {
            return NextResponse.json({ success: false, message: 'Invalid code ID' }, { status: 400 });
        }
        if (!code || typeof code !== 'string' || code.trim() === '' || code.length > 200) {
            return NextResponse.json({ success: false, message: 'Invalid code' }, { status: 400 });
        }
        if (note !== undefined && (typeof note !== 'string' || note.length > 200)) {
            return NextResponse.json({ success: false, message: 'Invalid note' }, { status: 400 });
        }

        const codeRef = db.collection('redeem_codes').doc(codeId);
        const codeDoc = await codeRef.get();
        if (!codeDoc.exists) {
            return NextResponse.json({ success: false, message: 'Code not found' }, { status: 404 });
        }

        await codeRef.update({
            code: code.trim(),
            note: (note || '').slice(0, 200),
            updated_at: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, message: 'Code updated successfully' });
    } catch (error) {
        console.error('[Edit Code] Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to update code' }, { status: 500 });
    }
}
