import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin } from '@/lib/admin-auth';
import { cacheGet, cacheSet } from '@/lib/memoryCache';

// redeem_codes can be a large collection. The admin codes table reads real
// document data, so keep the docs but cache the result briefly to absorb
// repeated views/polling. Pass ?fresh=1 to bypass.
const CODES_LIST_TTL_MS = 300 * 1000;

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
        const fresh = url.searchParams.get('fresh') === '1';

        const cacheKey = `admin:codes:list:${typeId || 'all'}`;
        if (!fresh) {
            const cached = cacheGet(cacheKey, CODES_LIST_TTL_MS);
            if (cached !== undefined) {
                return NextResponse.json({ success: true, data: cached });
            }
        }

        let query = adminDb.collection('redeem_codes');
        if (typeId) {
            query = query.where('typeId', '==', typeId);
        }
        query = query.limit(1000);

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

        cacheSet(cacheKey, codes);

        return NextResponse.json({ success: true, data: codes });
    } catch (error) {
        console.error('[Codes List] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to load codes' },
            { status: 500 }
        );
    }
}
