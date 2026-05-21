import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
    const { pathname } = req.nextUrl;

    // Protect dashboard pages — login + admin gate
    if (pathname.startsWith('/dashboard')) {
        const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!session) {
            return NextResponse.redirect(new URL('/', req.url));
        }
        const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
        if (!adminEmails.includes(session.email)) {
            return NextResponse.redirect(new URL('/', req.url));
        }
    }

    // CSP without per-request nonce: nonces require dynamic rendering, but most
    // pages here are statically prerendered, so the cached HTML never carries a
    // matching nonce and 'strict-dynamic' would block every script. We allow
    // 'unsafe-inline'/'unsafe-eval' for scripts (needed by Next.js hydration
    // and dev tooling) and rely on other defenses (input validation, output
    // escaping, server-side authz) to mitigate XSS.
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.googletagmanager.com;
        style-src 'self' 'unsafe-inline';
        img-src 'self' blob: data: https://*.cloudhost.id https://*.contabostorage.com https://abahcode.com https://upload.wikimedia.org https://api.qrserver.com https://placehold.co https://images.unsplash.com https://www.googletagmanager.com;
        font-src 'self';
        connect-src 'self' https://*.firebaseio.com https://*.firebaseapp.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        block-all-mixed-content;
        upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    const response = NextResponse.next();

    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

    return response;
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
