import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { assertSameOrigin } from '@/lib/security';

const DOC_ID_RE = /^[a-zA-Z0-9_-]{4,40}$/;

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

        const { codes, typeId, note } = body;

        if (!Array.isArray(codes) || codes.length === 0) {
            return NextResponse.json({ success: false, message: 'Codes array is required' }, { status: 400 });
        }
        if (codes.length > 500) {
            return NextResponse.json({ success: false, message: 'Max 500 codes per request' }, { status: 400 });
        }
        if (!typeId || typeof typeId !== 'string' || !DOC_ID_RE.test(typeId)) {
            return NextResponse.json({ success: false, message: 'Invalid type ID' }, { status: 400 });
        }
        if (note !== undefined && (typeof note !== 'string' || note.length > 200)) {
            return NextResponse.json({ success: false, message: 'Invalid note' }, { status: 400 });
        }

        const typeDoc = await db.collection('game_types').doc(typeId).get();
        if (!typeDoc.exists) {
            return NextResponse.json({ success: false, message: 'Type not found' }, { status: 404 });
        }

        const addedCodes = [];

        for (const code of codes) {
            if (!code || typeof code !== 'string') continue;
            const trimmed = code.trim();
            if (!trimmed || trimmed.length > 200) continue;

            const codeRef = db.collection('redeem_codes').doc();
            await codeRef.set({
                code: trimmed,
                type_id: typeId,
                note: (note || '').slice(0, 200),
                is_used: false,
                created_at: new Date().toISOString(),
            });
            addedCodes.push(trimmed);
        }

        if (addedCodes.length === 0) {
            return NextResponse.json({ success: false, message: 'No valid codes to add' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: `${addedCodes.length} code(s) added successfully`,
            addedCount: addedCodes.length,
        });
    } catch (error) {
        console.error('[Add Code] Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to add codes' }, { status: 500 });
    }
}
