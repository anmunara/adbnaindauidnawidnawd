import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin } from '@/lib/admin-auth';

function toIso(v) {
    if (!v) return null;
    if (typeof v === 'string') return v;
    if (v.toDate) return v.toDate().toISOString();
    if (v.seconds) return new Date(v.seconds * 1000).toISOString();
    if (v instanceof Date) return v.toISOString();
    return null;
}

export async function GET(req) {
    const auth = await requireAdmin();
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    try {
        const url = new URL(req.url);
        const typeId = url.searchParams.get('typeId');

        let query = adminDb.collection('redeem_codes');
        if (typeId) query = query.where('typeId', '==', typeId);

        const snap = await query.get();
        const codes = snap.docs.map((d) => {
            const data = d.data();
            return {
                id: d.id,
                code: data.code,
                typeId: data.typeId,
                note: data.note || '',
                isUsed: !!data.isUsed,
                soldTo: data.soldTo || null,
                transactionId: data.transactionId || null,
                createdAt: toIso(data.createdAt),
                soldAt: toIso(data.soldAt),
                updatedAt: toIso(data.updatedAt),
            };
        });

        codes.sort((a, b) => {
            const aTime = new Date(a.createdAt || 0).getTime();
            const bTime = new Date(b.createdAt || 0).getTime();
            return bTime - aTime;
        });

        return NextResponse.json({ success: true, data: codes });
    } catch (error) {
        console.error('[Codes List] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to load codes' },
            { status: 500 }
        );
    }
}
