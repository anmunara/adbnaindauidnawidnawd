-- SQLite Database Schema for KingBlox
-- Migrated from Firebase/Firestore
-- Date: 2026-06-04

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- =============================================================================
-- USERS TABLE
-- Stores user authentication and profile data
-- Replaces Firebase Auth + Firestore users collection
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,              -- User ID (generated, replaces Firebase UID)
    email TEXT UNIQUE NOT NULL,       -- Email address (indexed for login)
    password_hash TEXT NOT NULL,      -- bcrypt password hash
    name TEXT NOT NULL,               -- Display name
    whatsapp TEXT,                    -- Optional WhatsApp number
    role TEXT DEFAULT 'user',         -- Role: 'user' or 'admin'
    created_at TEXT NOT NULL,         -- ISO 8601 timestamp
    updated_at TEXT NOT NULL          -- ISO 8601 timestamp
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =============================================================================
-- GAME_TYPES TABLE
-- Product catalog
-- Replaces Firestore game_types collection
-- =============================================================================
CREATE TABLE IF NOT EXISTS game_types (
    id TEXT PRIMARY KEY,              -- Product ID (e.g., 'redfinger-1month')
    name TEXT NOT NULL,               -- Product display name
    selling_price INTEGER NOT NULL,   -- Price in IDR (stored as integer)
    capital_price INTEGER,            -- Cost price for profit calculation
    category TEXT DEFAULT 'redfinger', -- Category: 'redfinger', 'roblox', or an Abahcode category
    source TEXT DEFAULT 'local',      -- 'local' (own redeem_codes stock) or 'abahcode' (dropship)
    provider_product_id TEXT,         -- Abahcode product id (when source='abahcode')
    created_at TEXT NOT NULL          -- ISO 8601 timestamp
);

CREATE INDEX IF NOT EXISTS idx_game_types_source ON game_types(source);

CREATE INDEX idx_game_types_category ON game_types(category);
CREATE INDEX idx_game_types_created_at ON game_types(created_at DESC);

-- =============================================================================
-- REDEEM_CODES TABLE
-- Inventory of redeem codes
-- Replaces Firestore redeem_codes collection
-- CRITICAL: Composite index on (type_id, is_used) for stock checks
-- =============================================================================
CREATE TABLE IF NOT EXISTS redeem_codes (
    id TEXT PRIMARY KEY,              -- Code document ID (generated)
    code TEXT NOT NULL UNIQUE,        -- The actual redeem code
    type_id TEXT NOT NULL,            -- References game_types(id)
    note TEXT,                        -- Admin notes
    is_used INTEGER DEFAULT 0,        -- 0 = available, 1 = sold (boolean as int)
    sold_to TEXT,                     -- User ID or Discord ID who purchased
    transaction_id TEXT,              -- Order/transaction ID
    sold_at TEXT,                     -- ISO 8601 timestamp when sold
    created_at TEXT NOT NULL,         -- ISO 8601 timestamp
    updated_at TEXT NOT NULL,         -- ISO 8601 timestamp
    FOREIGN KEY (type_id) REFERENCES game_types(id) ON DELETE CASCADE
);

-- CRITICAL INDEX: Required for stock checking queries (C-4 race condition prevention)
CREATE INDEX idx_redeem_codes_type_unused ON redeem_codes(type_id, is_used);
CREATE INDEX idx_redeem_codes_code ON redeem_codes(code);
CREATE INDEX idx_redeem_codes_transaction ON redeem_codes(transaction_id);

-- =============================================================================
-- ORDERS TABLE
-- Web orders (from website)
-- Replaces Firestore orders collection
-- =============================================================================
CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY,        -- Order ID (e.g., 'TRX-1234567890-abcd')
    user_id TEXT NOT NULL,            -- User identifier (game username or user ID)
    user_email TEXT,                  -- User email from session
    item_id TEXT NOT NULL,            -- References game_types(id)
    item_name TEXT NOT NULL,          -- Product name (denormalized)
    price INTEGER NOT NULL,           -- Amount paid in IDR
    payment_method TEXT,              -- Payment method code (e.g., 'SQ', 'QRIS')
    status TEXT DEFAULT 'PENDING',    -- PENDING, SUCCESS, FAILED, EXPIRED
    qr_string TEXT,                   -- QRIS payment string
    va_number TEXT,                   -- Virtual account number
    payment_url TEXT,                 -- Payment gateway URL
    reference TEXT,                   -- Duitku reference
    duitku_reference TEXT,            -- Duitku reference from callback
    expiry_time TEXT,                 -- Payment expiry time
    redeem_code TEXT,                 -- Assigned code after payment
    provider_invoice TEXT,            -- Abahcode invoice_no (dropship fulfilment audit)
    paid_at TEXT,                     -- ISO 8601 timestamp when paid
    resent_at TEXT,                   -- ISO 8601 timestamp if admin resent
    failure_reason TEXT,              -- Reason if order failed
    result_code TEXT,                 -- Duitku result code on failure
    failed_at TEXT,                   -- ISO 8601 timestamp when failed
    created_at TEXT NOT NULL,         -- ISO 8601 timestamp
    updated_at TEXT NOT NULL,         -- ISO 8601 timestamp
    FOREIGN KEY (item_id) REFERENCES game_types(id)
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_user_email ON orders(user_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_item_id ON orders(item_id);

-- =============================================================================
-- TRANSACTIONS TABLE
-- Discord bot orders
-- Replaces Firestore transactions collection
-- =============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    order_id TEXT PRIMARY KEY,        -- Order ID (merchant order ID)
    user_id TEXT NOT NULL,            -- Discord user ID
    username TEXT,                    -- Discord username
    item_id TEXT NOT NULL,            -- References game_types(id)
    item_name TEXT NOT NULL,          -- Product name (denormalized)
    price INTEGER NOT NULL,           -- Amount paid in IDR
    payment_method TEXT,              -- Payment method code
    status TEXT DEFAULT 'PENDING',    -- PENDING, SUCCESS, FAILED
    qr_string TEXT,                   -- QRIS payment string
    va_number TEXT,                   -- Virtual account number
    reference TEXT,                   -- Duitku reference
    duitku_reference TEXT,            -- Duitku reference from callback
    expiry_time TEXT,                 -- Payment expiry time
    redeem_code TEXT,                 -- Assigned code after payment
    delivered INTEGER DEFAULT 0,      -- 0 = not delivered, 1 = delivered to Discord DM
    delivered_at TEXT,                -- ISO 8601 timestamp when delivered
    dm_message_id TEXT,               -- Discord message ID
    dm_channel_id TEXT,               -- Discord channel ID
    paid_at TEXT,                     -- ISO 8601 timestamp when paid
    resent_at TEXT,                   -- ISO 8601 timestamp if admin resent
    failure_reason TEXT,              -- Reason if order failed
    result_code TEXT,                 -- Duitku result code on failure
    failed_at TEXT,                   -- ISO 8601 timestamp when failed
    created_at TEXT NOT NULL,         -- ISO 8601 timestamp
    updated_at TEXT NOT NULL,         -- ISO 8601 timestamp
    FOREIGN KEY (item_id) REFERENCES game_types(id)
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_delivered ON transactions(status, delivered) WHERE status = 'SUCCESS';
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_item_id ON transactions(item_id);

-- =============================================================================
-- METADATA TABLE
-- Store app metadata like schema version
-- =============================================================================
CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO metadata (key, value, updated_at) VALUES
    ('schema_version', '1.0.0', datetime('now')),
    ('migrated_from', 'firebase', datetime('now')),
    ('migration_date', datetime('now'), datetime('now'));
