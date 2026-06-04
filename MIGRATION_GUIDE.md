# Firebase → SQLite Migration Guide

KingBlox has been migrated from Firebase/Firestore to a self-hosted SQLite database. No Firebase project, service account, or network calls are needed to run the app anymore.

## What Changed

| Before (Firebase) | After (SQLite) |
|---|---|
| Firebase Auth | NextAuth Credentials + bcrypt password hashing (`src/lib/auth.js`) |
| Firestore collections | SQLite tables (`src/lib/db/schema.sql`) |
| `firebase-admin` SDK | `better-sqlite3` via a Firestore-like wrapper (`src/lib/db.js`) |
| Firestore transactions | SQLite `BEGIN IMMEDIATE` transactions (same atomic guarantees) |
| Client login via Firebase SDK | Client posts email/password straight to NextAuth |

All security fixes from `SECURITY_AUDIT.md` are preserved: CSRF same-origin checks, per-IP/user rate limiting, server-side price lookup, atomic code allocation, amount verification, and session revoke on email/password change.

## Setup

```bash
# 1. Install dependencies (compiles better-sqlite3 native module)
npm install

# 2. Create your environment file
cp .env.example .env
#    Edit .env — set NEXTAUTH_SECRET (openssl rand -base64 48),
#    ADMIN_EMAILS, DUITKU_* credentials, and Discord config.

# 3. Create your first admin account (also initializes the database)
node scripts/seed.js --email you@example.com --password "StrongPass1!" --name "Admin"
#    The email MUST also appear in ADMIN_EMAILS in .env.

# 4. Run
npm run dev          # web + Discord bot
# or
npm run start:web    # web only
```

The SQLite file is created automatically at `DATABASE_PATH` (default `./data/kingblox.db`) on first run.

## Importing Existing Firebase Data (optional)

Only if you have existing production data in Firebase:

```bash
npm install firebase-admin            # dev-only, not needed at runtime
# In .env: FIREBASE_SERVICE_ACCOUNT=./service-account.json
node scripts/migrate-from-firebase.js
```

This exports `users`, `game_types`, `redeem_codes`, `orders`, `transactions` and converts field names automatically.

## Field Name Mapping (Firestore camelCase → SQLite snake_case)

| Firestore | SQLite |
|---|---|
| `sellingPrice` | `selling_price` |
| `capitalPrice` | `capital_price` |
| `typeId` | `type_id` |
| `isUsed` | `is_used` |
| `soldTo` | `sold_to` |
| `transactionId` | `transaction_id` |
| `soldAt` / `paidAt` / `createdAt` / `updatedAt` | `sold_at` / `paid_at` / `created_at` / `updated_at` |
| `userId` / `userEmail` | `user_id` / `user_email` |
| `itemId` / `itemName` | `item_id` / `item_name` |
| `paymentMethod` | `payment_method` |
| `qrString` / `vaNumber` | `qr_string` / `va_number` |
| `redeemCode` | `redeem_code` |
| `merchantOrderId` | `order_id` (primary key on orders/transactions) |

Timestamps are stored as ISO 8601 strings. Booleans are stored as integers (0/1) and converted back automatically by the wrapper.

## Known Limitations

- **Password reset** — the old flow used Firebase email links. There is no email infrastructure in the self-hosted build, so `/forgot-password` now directs users to contact an admin. An admin can reset a password by re-running `scripts/seed.js` with the user's email, or via the profile update API.
- **Rate limiting** is in-memory (per instance). For multi-instance deployments, use a shared store (e.g. Upstash Redis) as noted in `SECURITY_AUDIT.md` H-2.

## Notes

- `src/lib/firebaseAdmin.js` and `src/lib/firebase.js` are now unused by server routes. They are kept only so the optional migration script can reference firebase-admin; you can delete them once data import is done.
- The atomic code-allocation path (payment callback and admin resend) was verified to prevent double-allocation under concurrent requests.
