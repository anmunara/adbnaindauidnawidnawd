/**
 * Seed script — create the first admin user and optional sample products.
 *
 * The SQLite build has no Firebase data to import, so use this to bootstrap
 * a fresh database with an admin account you can log in with.
 *
 * Usage:
 *   node scripts/seed.js --email admin@example.com --password "StrongPass1!" --name "Admin"
 *
 * Notes:
 *   - The email you pass should ALSO be listed in ADMIN_EMAILS in your .env
 *     so admin routes recognise it.
 *   - Re-running with the same email updates that user's password/name.
 */

const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// dotenv is optional — only needed if DATABASE_PATH lives in .env.
try {
    require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
} catch { /* dotenv not installed; rely on process env / defaults */ }

function arg(flag, fallback) {
    const i = process.argv.indexOf(flag);
    return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const email = (arg('--email') || '').trim().toLowerCase();
const password = arg('--password');
const name = arg('--name', 'Admin');

if (!email || !password) {
    console.error('Usage: node scripts/seed.js --email <email> --password <password> [--name <name>]');
    process.exit(1);
}

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'kingblox.db');
const SCHEMA_PATH = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Ensure schema exists
const hasUsers = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
if (!hasUsers) {
    console.log('Initializing schema...');
    db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
}

const now = new Date().toISOString();
const passwordHash = bcrypt.hashSync(password, 12);

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

if (existing) {
    db.prepare('UPDATE users SET password_hash = ?, name = ?, role = ?, updated_at = ? WHERE email = ?')
        .run(passwordHash, name, 'admin', now, email);
    console.log(`Updated existing admin user: ${email}`);
} else {
    const id = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    db.prepare(`INSERT INTO users (id, email, password_hash, name, whatsapp, role, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, email, passwordHash, name, null, 'admin', now, now);
    console.log(`Created admin user: ${email}`);
}

console.log('\nDone. Make sure your .env ADMIN_EMAILS includes this email:');
console.log(`  ADMIN_EMAILS=${email}`);

db.close();
