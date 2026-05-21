import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { assertSameOrigin } from '@/lib/security';

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { firstAttempt: now, count: 1 });
        return false;
    }

    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
        return true;
    }
    return false;
}

// Validation functions
function validateName(name) {
    if (!name) return { valid: false, error: 'Name is required' };
    if (typeof name !== 'string') return { valid: false, error: 'Name must be a string' };
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 50) return { valid: false, error: 'Name must be 2-50 characters' };
    if (!/^[a-zA-Z0-9\s]+$/.test(trimmed)) return { valid: false, error: 'Name can only contain letters, numbers, and spaces' };
    return { valid: true, value: trimmed };
}

function validateEmail(email) {
    if (!email) return { valid: false, error: 'Email is required' };
    if (typeof email !== 'string') return { valid: false, error: 'Email must be a string' };
    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) return { valid: false, error: 'Invalid email format' };
    return { valid: true, value: trimmed };
}

function validatePassword(password) {
    if (!password) return { valid: false, error: 'Password is required' };
    if (typeof password !== 'string') return { valid: false, error: 'Password must be a string' };
    if (password.length < 8 || password.length > 128) return { valid: false, error: 'Password must be 8-128 characters' };
    if (!/[A-Z]/.test(password)) return { valid: false, error: 'Password must contain at least one uppercase letter' };
    if (!/[a-z]/.test(password)) return { valid: false, error: 'Password must contain at least one lowercase letter' };
    if (!/[0-9]/.test(password)) return { valid: false, error: 'Password must contain at least one number' };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { valid: false, error: 'Password must contain at least one special character' };
    return { valid: true, value: password };
}

function validateWhatsApp(whatsapp) {
    if (!whatsapp) return { valid: true, value: '' };
    if (typeof whatsapp !== 'string') return { valid: false, error: 'WhatsApp must be a string' };
    const cleaned = whatsapp.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 15) return { valid: false, error: 'WhatsApp number must be 10-15 digits' };
    if (!/^[0-9]+$/.test(cleaned)) return { valid: false, error: 'WhatsApp can only contain numbers' };
    return { valid: true, value: cleaned };
}

export async function POST(req) {
    try {
        const originErr = assertSameOrigin(req);
        if (originErr) return originErr;

        // Rate limiting
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   req.headers.get('x-real-ip') ||
                   'unknown';
        if (isRateLimited(ip)) {
            return NextResponse.json(
                { success: false, message: 'Terlalu banyak percobaan. Coba lagi nanti.' },
                { status: 429 }
            );
        }

        // Authentication check
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Get user UID from session
        const uid = session.user.id;
        if (!uid) {
            return NextResponse.json({ success: false, message: 'User ID not found' }, { status: 400 });
        }

        // Parse and validate body
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
        }

        const { name, email, whatsapp, password } = body;

        // Validate at least one field is provided
        if (!name && !email && !whatsapp && !password) {
            return NextResponse.json(
                { success: false, message: 'At least one field must be provided for update' },
                { status: 400 }
            );
        }

        // Validate each field if provided
        const updateData = {};
        const firestoreData = {};

        if (name !== undefined) {
            const nameValidation = validateName(name);
            if (!nameValidation.valid) {
                return NextResponse.json({ success: false, message: nameValidation.error }, { status: 400 });
            }
            updateData.displayName = nameValidation.value;
        }

        if (email !== undefined) {
            const emailValidation = validateEmail(email);
            if (!emailValidation.valid) {
                return NextResponse.json({ success: false, message: emailValidation.error }, { status: 400 });
            }
            updateData.email = emailValidation.value;
        }

        if (whatsapp !== undefined) {
            const waValidation = validateWhatsApp(whatsapp);
            if (!waValidation.valid) {
                return NextResponse.json({ success: false, message: waValidation.error }, { status: 400 });
            }
            firestoreData.whatsapp = waValidation.value;
        }

        if (password !== undefined) {
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                return NextResponse.json({ success: false, message: passwordValidation.error }, { status: 400 });
            }
            updateData.password = passwordValidation.value;
        }

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0 && Object.keys(firestoreData).length === 0) {
            return NextResponse.json(
                { success: false, message: 'No valid fields to update' },
                { status: 400 }
            );
        }

        // Detect changes that should invalidate the current session — namely
        // email and password. After such changes, the JWT still holds the old
        // claims (incl. an `email` that admin checks rely on), so we tell the
        // client to sign out and re-authenticate before continuing.
        const sessionInvalidated =
            ('email' in updateData && updateData.email !== session.user.email) ||
            'password' in updateData;

        // Update user in Firebase Auth
        if (Object.keys(updateData).length > 0) {
            await adminAuth.updateUser(uid, updateData);
            // Revoke existing Firebase refresh tokens; combined with frontend signOut
            // this prevents the old session from continuing to act as the old identity.
            if (sessionInvalidated) {
                try {
                    await adminAuth.revokeRefreshTokens(uid);
                } catch (e) {
                    console.error('[Profile Update] revokeRefreshTokens failed:', e);
                }
            }
        }

        // Update Firestore
        if (adminDb && Object.keys(firestoreData).length > 0) {
            await adminDb.collection('users').doc(uid).set({
                ...firestoreData,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        }

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            requireReauth: sessionInvalidated,
        });

    } catch (error) {
        console.error('Profile update error:', error);

        if (error.code === 'auth/email-already-exists') {
            return NextResponse.json({ success: false, message: 'Email already in use' }, { status: 409 });
        }
        if (error.code === 'auth/invalid-email') {
            return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 });
        }
        if (error.code === 'auth/weak-password') {
            return NextResponse.json({ success: false, message: 'Password is too weak' }, { status: 400 });
        }
        if (error.code === 'auth/user-not-found') {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: false, message: 'Failed to update profile' }, { status: 500 });
    }
}
