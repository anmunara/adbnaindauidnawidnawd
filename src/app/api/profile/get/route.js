import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userDoc = await db.collection('users').doc(session.user.id).get();
        if (!userDoc.exists) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }
        const data = userDoc.data();
        return NextResponse.json({
            success: true,
            name: data.name || '',
            email: data.email || session.user.email || '',
            whatsapp: data.whatsapp || '',
        });
    } catch (error) {
        console.error('[Profile Get] Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to load profile' }, { status: 500 });
    }
}
