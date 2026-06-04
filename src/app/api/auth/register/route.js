import { NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { assertSameOrigin } from '@/lib/security';

// Rate limiting: track IPs
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 attempts per minute

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

export async function POST(req) {
    try {
        const originErr = assertSameOrigin(req);
        if (originErr) return originErr;

        // Rate limiting
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        if (isRateLimited(ip)) {
            return NextResponse.json(
                { success: false, message: 'Terlalu banyak percobaan. Coba lagi nanti.' },
                { status: 429 }
            );
        }

        const { name, email, password, whatsapp } = await req.json();

        // === SERVER-SIDE VALIDATION ===

        // Check required fields
        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, message: 'Semua field wajib diisi.' },
                { status: 400 }
            );
        }

        // Validate name (2-50 chars, no special chars)
        const nameClean = name.trim();
        if (nameClean.length < 2 || nameClean.length > 50) {
            return NextResponse.json(
                { success: false, message: 'Nama harus 2-50 karakter.' },
                { status: 400 }
            );
        }
        if (!/^[a-zA-Z0-9\s]+$/.test(nameClean)) {
            return NextResponse.json(
                { success: false, message: 'Nama hanya boleh huruf, angka, dan spasi.' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailClean = email.trim().toLowerCase();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(emailClean)) {
            return NextResponse.json(
                { success: false, message: 'Format email tidak valid.' },
                { status: 400 }
            );
        }

        // Block self-registration of admin emails. Admin is granted by
        // ADMIN_EMAILS; without this guard anyone could register an as-yet
        // unregistered admin address and gain admin access. Admin accounts
        // must be provisioned out-of-band (scripts/seed.js).
        const adminEmails = (process.env.ADMIN_EMAILS || '')
            .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
        if (adminEmails.includes(emailClean)) {
            return NextResponse.json(
                { success: false, message: 'Email tidak dapat digunakan.' },
                { status: 403 }
            );
        }

        // Validate password strength — must match profile/update rules
        if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
            return NextResponse.json(
                { success: false, message: 'Password 8-128 karakter.' },
                { status: 400 }
            );
        }
        if (!/[A-Z]/.test(password)) {
            return NextResponse.json(
                { success: false, message: 'Password harus mengandung huruf besar.' },
                { status: 400 }
            );
        }
        if (!/[a-z]/.test(password)) {
            return NextResponse.json(
                { success: false, message: 'Password harus mengandung huruf kecil.' },
                { status: 400 }
            );
        }
        if (!/[0-9]/.test(password)) {
            return NextResponse.json(
                { success: false, message: 'Password harus mengandung angka.' },
                { status: 400 }
            );
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return NextResponse.json(
                { success: false, message: 'Password harus mengandung karakter spesial.' },
                { status: 400 }
            );
        }

        // Validate WhatsApp (optional, but if provided must be valid)
        if (whatsapp) {
            const waClean = whatsapp.replace(/\D/g, '');
            if (waClean.length < 10 || waClean.length > 15) {
                return NextResponse.json(
                    { success: false, message: 'Nomor WhatsApp tidak valid.' },
                    { status: 400 }
                );
            }
        }

        // Create user in SQLite database
        const user = await createUser({
            email: emailClean,
            password: password,
            name: nameClean,
            whatsapp: whatsapp ? whatsapp.replace(/\D/g, '') : '',
            role: 'user'
        });

        return NextResponse.json({
            success: true,
            message: 'Akun berhasil dibuat! Silakan login.'
        });

    } catch (error) {
        console.error('Registration error:', error);

        // Handle specific error messages
        if (error.message === 'Email already registered') {
            return NextResponse.json(
                { success: false, message: 'Email sudah terdaftar.' },
                { status: 409 }
            );
        }
        if (error.message === 'Invalid email format') {
            return NextResponse.json(
                { success: false, message: 'Format email tidak valid.' },
                { status: 400 }
            );
        }
        if (error.message && error.message.includes('Password')) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: 'Terjadi kesalahan server.' },
            { status: 500 }
        );
    }
}
