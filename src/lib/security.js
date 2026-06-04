import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

const DOC_ID_RE = /^[a-zA-Z0-9_-]{4,40}$/;
const ORDER_ID_RE = /^TRX-\d{10,16}-[0-9a-zA-Z]{4,16}$/;

export function isValidDocId(id) {
    return typeof id === 'string' && DOC_ID_RE.test(id);
}

export function isValidOrderId(id) {
    return typeof id === 'string' && ORDER_ID_RE.test(id);
}

function getAllowedOrigins() {
    const fromEnv = (process.env.ALLOWED_ORIGINS || process.env.NEXTAUTH_URL || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    return fromEnv.length > 0 ? fromEnv : ['http://localhost:3000'];
}

/**
 * Block cross-origin state-changing requests (CSRF defense).
 * Returns a NextResponse error if blocked, otherwise null.
 * Skip for GET/HEAD requests since they should not mutate state.
 */
export function assertSameOrigin(req) {
    if (req.method === 'GET' || req.method === 'HEAD') return null;

    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const allowed = getAllowedOrigins();

    const source = origin || (referer ? new URL(referer).origin : null);
    if (!source) {
        return NextResponse.json(
            { success: false, message: 'Missing origin' },
            { status: 403 }
        );
    }
    if (!allowed.includes(source)) {
        return NextResponse.json(
            { success: false, message: 'Forbidden origin' },
            { status: 403 }
        );
    }
    return null;
}

/**
 * Authenticate an internal bot->web request via a shared secret.
 * The Host header is client-controlled and cannot be trusted, so we require
 * a constant-time match against BOT_API_SECRET instead. Returns a NextResponse
 * error if unauthorized, otherwise null.
 */
export function assertBotSecret(req) {
    const expected = process.env.BOT_API_SECRET || '';
    const provided = req.headers.get('x-bot-secret') || '';

    // Reject if not configured — fail closed rather than open.
    if (!expected) {
        return NextResponse.json(
            { success: false, message: 'Forbidden' },
            { status: 403 }
        );
    }

    const a = Buffer.from(expected);
    const b = Buffer.from(provided);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return NextResponse.json(
            { success: false, message: 'Forbidden' },
            { status: 403 }
        );
    }
    return null;
}

/**
 * Mask a redeem code for logging — keep only first 2 chars, hide the rest.
 * Codes carry monetary value, so reveal as little as possible.
 */
export function maskCode(code) {
    if (!code || typeof code !== 'string') return '';
    if (code.length <= 4) return '***';
    return `${code.slice(0, 2)}***`;
}

/**
 * Mask an email address for logging.
 */
export function maskEmail(email) {
    if (!email || typeof email !== 'string') return '';
    const [user, domain] = email.split('@');
    if (!domain) return '***';
    const u = user.length <= 2 ? '*' : `${user[0]}***${user.slice(-1)}`;
    return `${u}@${domain}`;
}
