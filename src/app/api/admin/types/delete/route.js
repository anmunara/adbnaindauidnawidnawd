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

        const { typeId } = body;

        if (!isValidDocId(typeId)) {
            return NextResponse.json({ success: false, message: 'Invalid type ID' }, { status: 400 });
        }

        const ref = db.collection('game_types').doc(typeId);
        const typeDoc = await ref.get();
        if (!typeDoc.exists) {
            return NextResponse.json({ success: false, message: 'Type not found' }, { status: 404 });
        }

        const codesSnapshot = await db.collection('redeem_codes')
            .where('type_id', '==', typeId)
            .where('is_used', '==', false)
            .limit(1)
            .get();

        if (!codesSnapshot.empty) {
            return NextResponse.json(
                { success: false, message: 'Cannot delete type with unsold codes. Please delete all codes first.' },
                { status: 400 }
            );
        }

        const typeData = typeDoc.data();
        await ref.delete();

        return NextResponse.json({
            success: true,
            message: `Type "${typeData.name}" deleted successfully`,
        });
    } catch (error) {
        console.error('[Delete Type] Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete type' }, { status: 500 });
    }
}
