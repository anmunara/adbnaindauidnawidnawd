# Security Audit Report - KingBlox
**Tanggal Audit:** 16 Maret 2026  
**Auditor:** AI Security Assistant  
**Scope:** Full Application Stack

---

## Executive Summary

| Kategori | Status | Catatan |
|----------|--------|---------|
| Authentication | 🟡 MEDIUM | Beberapa area perlu perbaikan |
| Authorization | 🟢 GOOD | Role-based access control OK |
| Input Validation | 🟡 MEDIUM | Perlu sanitasi lebih ketat |
| Data Protection | 🟢 GOOD | Environment variables digunakan |
| API Security | 🟡 MEDIUM | Perlu rate limiting tambahan |
| Payment Security | 🟢 GOOD | Signature verification OK |

---

## 1. AUTHENTICATION & AUTHORIZATION

### 1.1 Next-Auth Configuration (`src/app/api/auth/[...nextauth]/route.js`)

**Status:** 🟢 GOOD

**Strengths:**
- ✅ Menggunakan Firebase Admin SDK untuk verifikasi token
- ✅ JWT strategy dengan session callbacks
- ✅ Error handling untuk token verification

**Issues:**
- ⚠️ **Line 9:** `credentials: {}` - Kosong, tidak ada validasi struktur credentials
- ⚠️ **Line 11:** Tidak ada validasi format idToken sebelum verify

**Rekomendasi:**
```javascript
// Tambahkan validasi credentials
credentials: {
    idToken: { label: "ID Token", type: "text" }
},

// Validasi idToken
if (!idToken || typeof idToken !== 'string' || idToken.length < 100) {
    return null;
}
```

### 1.2 Admin Check (`src/app/api/user/check-admin/route.js`)

**Status:** 🟢 GOOD

**Strengths:**
- ✅ Server-side session validation
- ✅ Environment variable untuk admin list
- ✅ Proper error handling

---

## 2. INPUT VALIDATION & SANITIZATION

### 2.1 Registration (`src/app/api/auth/register/route.js`)

**Status:** 🟡 MEDIUM

**Strengths:**
- ✅ Rate limiting (5 attempts/minute)
- ✅ Server-side validation lengkap
- ✅ Password strength requirements
- ✅ Email format validation
- ✅ XSS prevention pada name (regex alphanumeric only)

**Issues:**
- ⚠️ **Line 28:** IP extraction bisa dimanipulasi dengan header spoofing
- ⚠️ **Line 56:** Regex `/^[a-zA-Z0-9\s]+$/` masih bisa bypass dengan Unicode
- ⚠️ **Line 64:** Email tidak di-normalize (trim + lowercase)
- ⚠️ **Line 94-102:** WhatsApp validation hanya length, tidak cek format
- ⚠️ Tidak ada sanitasi untuk prevent NoSQL injection

**Rekomendasi:**
```javascript
// IP extraction yang lebih aman
const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
           req.headers.get('x-real-ip') || 
           'unknown';

// Name sanitasi lebih ketat
const nameClean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');

// Email normalization
const emailClean = email.trim().toLowerCase().normalize('NFC');

// WhatsApp format validation
const waRegex = /^[0-9]{10,15}$/;
if (!waRegex.test(waClean)) {
    return error response;
}
```

### 2.2 Profile Update (`src/app/api/profile/update/route.js`)

**Status:** 🔴 HIGH RISK

**Critical Issues:**
- 🔴 **Line 14:** Tidak ada validasi input sama sekali!
- 🔴 **Line 24-27:** Direct assignment tanpa sanitasi
- 🔴 **Line 30-32:** Password update tanpa strength validation
- 🔴 **Line 38-41:** Firestore update tanpa field validation

**Rekomendasi:**
```javascript
// Tambahkan validasi lengkap
const { name, email, whatsapp, password } = await req.json();

// Validasi name
if (name && (name.length < 2 || name.length > 50 || !/^[a-zA-Z0-9\s]+$/.test(name))) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
}

// Validasi email
if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
}

// Validasi password
if (password) {
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return NextResponse.json({ error: 'Weak password' }, { status: 400 });
    }
}

// Validasi whatsapp
if (whatsapp && !/^[0-9]{10,15}$/.test(whatsapp.replace(/\D/g, ''))) {
    return NextResponse.json({ error: 'Invalid WhatsApp' }, { status: 400 });
}
```

---

## 3. PAYMENT SECURITY

### 3.1 Transaction Create (`src/app/api/transaction/create/route.js`)

**Status:** 🟢 GOOD

**Strengths:**
- ✅ Stock check sebelum create payment
- ✅ MD5 signature untuk Duitku
- ✅ Proper error handling
- ✅ QR String validation

**Issues:**
- ⚠️ **Line 37-38:** Email dan phoneNumber hardcoded (customer@example.com)
- ⚠️ **Line 30:** Math.random() untuk order ID - bisa collision
- ⚠️ Tidak ada rate limiting untuk create transaction

**Rekomendasi:**
```javascript
// Gunakan crypto untuk order ID
const orderId = `TRX-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

// Rate limiting
const rateLimitKey = `trx:${userId}`;
// Implementasi rate limiting dengan Redis atau memory store
```

### 3.2 Payment Callback (`src/app/api/payment/duitku/callback/route.js`)

**Status:** 🟢 GOOD

**Strengths:**
- ✅ Signature verification
- ✅ Idempotent (check if already paid)
- ✅ Atomic code allocation
- ✅ Proper logging

**Issues:**
- ⚠️ **Line 7-19:** Firebase Admin double initialization (sudah ada di firebaseAdmin.js)

### 3.3 Alternative Callback (`src/app/api/transaction/callback/route.js`)

**Status:** 🟡 MEDIUM

**Issues:**
- ⚠️ Tidak ada code allocation seperti di duitku/callback
- ⚠️ Hanya update status, tidak deliver product

---

## 4. DATABASE SECURITY

### 4.1 Firebase Admin (`src/lib/firebaseAdmin.js`)

**Status:** 🟢 GOOD

**Strengths:**
- ✅ Environment variables untuk credentials
- ✅ Private key sanitasi (replace \\n)
- ✅ Singleton pattern

**Issues:**
- ⚠️ **Line 17-18:** Error logging bisa expose sensitive info

### 4.2 Client Firebase (`src/lib/firebase.js`)

**Status:** 🟢 GOOD

**Strengths:**
- ✅ Public API key (safe for client)
- ✅ Analytics hanya di client side

---

## 5. MIDDLEWARE & HEADERS

### 5.1 Middleware (`src/middleware.js`)

**Status:** 🟢 GOOD

**Strengths:**
- ✅ CSP (Content Security Policy)
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy
- ✅ Permissions-Policy
- ✅ Admin route protection

**Issues:**
- ⚠️ **Line 26:** `'unsafe-eval'` dan `'unsafe-inline'` di script-src (perlu untuk Next.js tapi kurang aman)
- ⚠️ **Line 23:** Nonce tidak digunakan di CSP

---

## 6. API ENDPOINTS SECURITY

### 6.1 Products API (`src/app/api/products/get/route.js`)

**Status:** 🟢 GOOD

**Strengths:**
- ✅ No cache (real-time stock)
- ✅ Admin SDK (secure)

### 6.2 Transaction Check (`src/app/api/transaction/check/route.js`)

**Status:** 🟡 MEDIUM

**Issues:**
- ⚠️ Tidak ada authentication check - siapa saja bisa cek order ID
- ⚠️ Bisa digunakan untuk enumeration attack

**Rekomendasi:**
```javascript
// Tambahkan session check
const session = await getServerSession(authOptions);
if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Verify order belongs to user
if (data.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## 7. CLIENT-SIDE SECURITY

### 7.1 LocalStorage Usage (Cart)

**Status:** 🟡 MEDIUM

**Issues:**
- ⚠️ Cart data di localStorage bisa dimanipulasi client-side
- ⚠️ Tidak ada validasi integrity saat checkout

**Rekomendasi:**
```javascript
// Tambahkan checksum atau re-fetch price dari server
const handleCheckout = async () => {
    // Re-validate cart items dengan server
    const validation = await fetch('/api/cart/validate', {
        method: 'POST',
        body: JSON.stringify({ items: cart })
    });
    // Only proceed if validation passes
};
```

---

## 8. ENVIRONMENT VARIABLES

### 8.1 Required Variables

| Variable | Status | Risk |
|----------|--------|------|
| NEXTAUTH_SECRET | 🟢 | OK |
| FIREBASE_PRIVATE_KEY | 🟢 | OK |
| DUITKU_API_KEY | 🟢 | OK |
| ADMIN_EMAILS | 🟢 | OK |
| NEXT_PUBLIC_* | 🟡 | Public, safe |

### 8.2 Missing Variables Check

✅ Semua environment variables sudah ada null check

---

## 9. CRITICAL VULNERABILITIES

### 🔴 HIGH SEVERITY

1. **Profile Update - No Input Validation**
   - File: `src/app/api/profile/update/route.js`
   - Impact: Data corruption, potential privilege escalation
   - Fix: Tambahkan validasi lengkap

2. **Transaction Check - No Auth**
   - File: `src/app/api/transaction/check/route.js`
   - Impact: Information disclosure, order enumeration
   - Fix: Tambahkan session check

### 🟡 MEDIUM SEVERITY

3. **Rate Limiting Incomplete**
   - Hanya register yang punya rate limiting
   - Fix: Tambahkan rate limiting untuk semua API

4. **Cart Manipulation**
   - Client-side cart bisa dimanipulasi
   - Fix: Server-side validation saat checkout

---

## 10. RECOMMENDATIONS

### Immediate Actions (High Priority)

1. **Fix Profile Update Validation**
```javascript
// src/app/api/profile/update/route.js
import { z } from 'zod'; // atau validator lain

const updateSchema = z.object({
    name: z.string().min(2).max(50).regex(/^[a-zA-Z0-9\s]+$/).optional(),
    email: z.string().email().optional(),
    whatsapp: z.string().regex(/^[0-9]{10,15}$/).optional(),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).optional()
});
```

2. **Add Auth to Transaction Check**
```javascript
// src/app/api/transaction/check/route.js
const session = await getServerSession(authOptions);
if (!session) return unauthorized;
```

3. **Implement Global Rate Limiting**
```javascript
// middleware.js atau API routes
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
```

### Medium Priority

4. **Add Input Sanitization Library**
   - Gunakan `zod`, `joi`, atau `validator.js`

5. **Implement API Key for Internal APIs**
   - Discord bot communication

6. **Add Request Logging**
   - Log semua API calls untuk audit trail

### Low Priority

7. **Remove unsafe-inline from CSP**
   - Gunakan nonce atau hash

8. **Add Security Headers di next.config.js**
   - HSTS, Expect-CT, dll

---

## 11. COMPLIANCE CHECK

| Standard | Status | Notes |
|----------|--------|-------|
| PCI DSS | 🟡 | Payment via Duitku (compliant), tapi perlu audit lebih lanjut |
| GDPR | 🟡 | Privacy policy ada, tapi perlu consent mechanism |
| OWASP Top 10 | 🟡 | Beberapa item masih perlu perbaikan |

---

## Conclusion

Secara umum, aplikasi KingBlox memiliki security foundation yang **cukup baik**, terutama di bagian:
- Payment processing (signature verification)
- Authentication (Firebase Admin)
- Basic input validation di register

Namun, terdapat **2 critical vulnerabilities** yang perlu diperbaiki segera:
1. Profile update tanpa validasi
2. Transaction check tanpa authentication

Setelah perbaikan tersebut, security level akan menjadi **GOOD**.

---

**Next Steps:**
1. Fix critical vulnerabilities (ETA: 1 hari)
2. Implement global rate limiting (ETA: 2 hari)
3. Add comprehensive logging (ETA: 3 hari)
4. Security testing ulang (ETA: 1 hari)
