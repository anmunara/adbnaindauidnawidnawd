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

    // Build per-request CSP nonce
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

    // CSP: nonce-based for scripts so XSS can't execute injected inline scripts.
    // 'strict-dynamic' lets scripts loaded by trusted nonced bootstrap load
    // their own deps without enumerating every host.
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://apis.google.com https://www.googletagmanager.com;
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

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', cspHeader);

    const response = NextResponse.next({ request: { headers: requestHeaders } });

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
