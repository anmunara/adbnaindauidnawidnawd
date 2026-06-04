import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { assertSameOrigin, isValidDocId } from '@/lib/security';

const MAX_PRICE = 100_000_000;
const VALID_CATEGORIES = ['redfinger', 'roblox'];

function sanitizePrice(v) {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > MAX_PRICE) return null;
    return Math.floor(n);
}

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

        const { typeId, name, sellingPrice, capitalPrice, category } = body;

        if (!isValidDocId(typeId)) {
            return NextResponse.json({ success: false, message: 'Invalid type ID' }, { status: 400 });
        }
        if (!name || typeof name !== 'string' || name.trim() === '' || name.length > 100) {
            return NextResponse.json({ success: false, message: 'Invalid type name' }, { status: 400 });
        }

        const sp = sanitizePrice(sellingPrice);
        const cp = sanitizePrice(capitalPrice);
        if (sp === null) {
            return NextResponse.json({ success: false, message: 'Invalid sellingPrice' }, { status: 400 });
        }
        if (cp === null) {
            return NextResponse.json({ success: false, message: 'Invalid capitalPrice' }, { status: 400 });
        }

        const ref = db.collection('game_types').doc(typeId);
        const typeDoc = await ref.get();
        if (!typeDoc.exists) {
            return NextResponse.json({ success: false, message: 'Type not found' }, { status: 404 });
        }

        const updates = {
            name: name.trim(),
            selling_price: sp,
            capital_price: cp,
            updated_at: new Date().toISOString(),
        };
        if (typeof category === 'string' && VALID_CATEGORIES.includes(category)) {
            updates.category = category;
        }

        await ref.update(updates);

        return NextResponse.json({ success: true, message: 'Type updated successfully' });
    } catch (error) {
        console.error('[Edit Type] Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to update type' }, { status: 500 });
    }
}
