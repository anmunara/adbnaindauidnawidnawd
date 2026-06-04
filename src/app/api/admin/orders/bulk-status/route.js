import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { assertSameOrigin } from '@/lib/security';

const ALLOWED = ['PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'REFUNDED'];

export async function POST(req) {
    const originErr = assertSameOrigin(req);
    if (originErr) return originErr;

    const auth = await requireAdmin();
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    try {
        const body = await req.json();
        const { orderIds, status } = body || {};

        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ success: false, message: 'orderIds array required' }, { status: 400 });
        }
        const normalized = String(status || '').toUpperCase();
        if (!ALLOWED.includes(normalized)) {
            return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
        }
        if (orderIds.length > 200) {
            return NextResponse.json({ success: false, message: 'Max 200 per batch' }, { status: 400 });
        }

        const now = new Date().toISOString();
        let updated = 0;

        for (const entry of orderIds) {
            const { id, source } = entry || {};
            if (typeof id !== 'string' || id.length > 64) continue;
            if (!['orders', 'transactions'].includes(source)) continue;
            const ref = db.collection(source).doc(id);
            const updates = { status: normalized, updated_at: now };
            if (normalized === 'SUCCESS') updates.paid_at = now;
            await ref.update(updates);
            updated += 1;
        }

        return NextResponse.json({ success: true, updated });
    } catch (error) {
        console.error('[Bulk Status] Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
    }
}
