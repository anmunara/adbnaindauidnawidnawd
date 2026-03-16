import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { name, email, whatsapp, password } = await req.json();

        // Get user UID from session
        const uid = session.user.id;

        if (!uid) {
            return NextResponse.json({ success: false, message: 'User ID not found' }, { status: 400 });
        }

        // Update user profile in Firebase
        const updateData = {
            displayName: name,
            email: email,
        };

        // Update password if provided
        if (password) {
            updateData.password = password;
        }

        await adminAuth.updateUser(uid, updateData);

        // Save WhatsApp to Firestore
        if (adminDb) {
            await adminDb.collection('users').doc(uid).set({
                whatsapp: whatsapp || '',
                updatedAt: new Date().toISOString()
            }, { merge: true });
        }

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to update profile'
        }, { status: 500 });
    }
}
