import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'kingblox.db');
const SCHEMA_PATH = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');

// Each table's primary key column. Firestore treats every doc as having an "id",
// but our schema uses different PK names per table.
const PRIMARY_KEYS = {
    users: 'id',
    game_types: 'id',
    redeem_codes: 'id',
    orders: 'order_id',
    transactions: 'order_id',
    metadata: 'key',
};

let conn = null;
const columnCache = {};

function initializeDatabase() {
    if (conn) return conn;

    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    conn = new Database(DB_PATH);
    conn.pragma('journal_mode = WAL');
    conn.pragma('foreign_keys = ON');

    const tableCheck = conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (!tableCheck) {
        console.log('Initializing database schema...');
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        conn.exec(schema);
        console.log('Database schema initialized successfully');
    }

    return conn;
}

function getDb() {
    if (!conn) {
        initializeDatabase();
    }
    return conn;
}

function pkColumn(table) {
    return PRIMARY_KEYS[table] || 'id';
}

// Identifier whitelisting (defense-in-depth against SQL injection).
// Table and column names are interpolated into SQL strings (they can't be
// bound as parameters), so every identifier must be validated against the
// real schema before use. Values are still bound with `?` placeholders.
function assertTable(table) {
    if (!Object.prototype.hasOwnProperty.call(PRIMARY_KEYS, table)) {
        throw new Error(`Unknown table: ${table}`);
    }
    return table;
}

function assertColumn(table, column) {
    if (!tableColumns(table).has(column)) {
        throw new Error(`Unknown column "${column}" on table "${table}"`);
    }
    return column;
}

function assertDirection(dir) {
    const d = String(dir).toUpperCase();
    if (d !== 'ASC' && d !== 'DESC') {
        throw new Error(`Invalid sort direction: ${dir}`);
    }
    return d;
}

// Cache the real column set per table so we never try to write a column that
// doesn't exist (e.g. game_types has no updated_at). Unknown keys are dropped.
function tableColumns(table) {
    if (columnCache[table]) return columnCache[table];
    const rows = getDb().prepare(`PRAGMA table_info(${assertTable(table)})`).all();
    const cols = new Set(rows.map((r) => r.name));
    columnCache[table] = cols;
    return cols;
}

function serialize(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object' && value.toDate) return value.toDate().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
}

function deserialize(row) {
    if (!row) return null;
    const data = { ...row };
    for (const key in data) {
        if (typeof data[key] === 'number' && (key.startsWith('is_') || key === 'delivered')) {
            data[key] = data[key] === 1;
        }
    }
    return data;
}

// Build an INSERT, keeping only columns that exist on the table and stamping
// created_at/updated_at only when those columns are present.
function buildInsert(table, docId, data) {
    const cols = tableColumns(table);
    const pk = pkColumn(table);
    const now = new Date().toISOString();

    const payload = { ...data };
    if (docId !== null && docId !== undefined) payload[pk] = docId;
    if (cols.has('created_at') && !payload.created_at) payload.created_at = now;
    if (cols.has('updated_at')) payload.updated_at = now;

    const fields = Object.keys(payload).filter((f) => cols.has(f));
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map((f) => serialize(payload[f]));

    return {
        sql: `INSERT OR REPLACE INTO ${assertTable(table)} (${fields.join(', ')}) VALUES (${placeholders})`,
        values,
    };
}

// Build an UPDATE, keeping only columns that exist and refreshing updated_at
// when present. Never includes the PK in the SET clause.
function buildUpdate(table, docId, data) {
    const cols = tableColumns(table);
    const pk = pkColumn(table);

    const payload = { ...data };
    if (cols.has('updated_at')) payload.updated_at = new Date().toISOString();
    delete payload[pk];

    const fields = Object.keys(payload).filter((f) => cols.has(f));
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => serialize(payload[f]));

    return {
        sql: `UPDATE ${assertTable(table)} SET ${setClause} WHERE ${pk} = ?`,
        values: [...values, docId],
    };
}

class DocumentReference {
    constructor(collectionName, docId) {
        this.collectionName = collectionName;
        this.docId = docId;
    }

    async get() {
        const pk = pkColumn(this.collectionName);
        const row = getDb().prepare(`SELECT * FROM ${assertTable(this.collectionName)} WHERE ${pk} = ?`).get(this.docId);
        return {
            exists: !!row,
            id: this.docId,
            data: () => deserialize(row),
            ref: this,
        };
    }

    async set(data) {
        const { sql, values } = buildInsert(this.collectionName, this.docId, data);
        getDb().prepare(sql).run(...values);
    }

    async update(data) {
        const { sql, values } = buildUpdate(this.collectionName, this.docId, data);
        getDb().prepare(sql).run(...values);
    }

    async delete() {
        const pk = pkColumn(this.collectionName);
        getDb().prepare(`DELETE FROM ${assertTable(this.collectionName)} WHERE ${pk} = ?`).run(this.docId);
    }

    serialize(value) {
        return serialize(value);
    }

    deserialize(row) {
        return deserialize(row);
    }
}

class Query {
    constructor(collectionName) {
        this.collectionName = collectionName;
        this.whereConditions = [];
        this.orderByField = null;
        this.orderDirection = 'ASC';
        this.limitCount = null;
    }

    where(field, operator, value) {
        let sqlOp = operator;
        if (operator === '==') sqlOp = '=';
        else if (operator === 'array-contains') {
            this.whereConditions.push({ field, operator: 'LIKE', value: `%${value}%` });
            return this;
        }
        // Whitelist the operator — it is interpolated into SQL, not bound.
        const ALLOWED_OPS = new Set(['=', '!=', '<', '<=', '>', '>=', 'LIKE']);
        if (!ALLOWED_OPS.has(sqlOp)) {
            throw new Error(`Invalid query operator: ${operator}`);
        }
        this.whereConditions.push({ field, operator: sqlOp, value });
        return this;
    }

    orderBy(field, direction = 'asc') {
        this.orderByField = field;
        this.orderDirection = direction.toUpperCase();
        return this;
    }

    limit(count) {
        this.limitCount = count;
        return this;
    }

    _buildWhere(params) {
        if (this.whereConditions.length === 0) return '';
        const clauses = this.whereConditions.map((w) => {
            assertColumn(this.collectionName, w.field);
            params.push(serialize(w.value));
            return `${w.field} ${w.operator} ?`;
        });
        return ' WHERE ' + clauses.join(' AND ');
    }

    async get() {
        const params = [];
        let sql = `SELECT * FROM ${assertTable(this.collectionName)}`;
        sql += this._buildWhere(params);
        if (this.orderByField) {
            sql += ` ORDER BY ${assertColumn(this.collectionName, this.orderByField)} ${assertDirection(this.orderDirection)}`;
        }
        if (this.limitCount) sql += ` LIMIT ${Number(this.limitCount) | 0}`;

        const rows = getDb().prepare(sql).all(...params);
        const pk = pkColumn(this.collectionName);

        return {
            empty: rows.length === 0,
            size: rows.length,
            docs: rows.map((row) => ({
                id: row[pk],
                exists: true,
                data: () => deserialize(row),
                ref: new DocumentReference(this.collectionName, row[pk]),
            })),
        };
    }

    async count() {
        const params = [];
        let sql = `SELECT COUNT(*) AS c FROM ${assertTable(this.collectionName)}`;
        sql += this._buildWhere(params);
        const row = getDb().prepare(sql).get(...params);
        return row.c;
    }
}

class CollectionReference {
    constructor(name) {
        this.name = name;
    }

    doc(id) {
        return new DocumentReference(this.name, id);
    }

    where(field, operator, value) {
        return new Query(this.name).where(field, operator, value);
    }

    orderBy(field, direction) {
        return new Query(this.name).orderBy(field, direction);
    }

    limit(count) {
        return new Query(this.name).limit(count);
    }

    async add(data) {
        const id = this.generateId();
        const docRef = this.doc(id);
        await docRef.set(data);
        return docRef;
    }

    async get() {
        return new Query(this.name).get();
    }

    async count() {
        return new Query(this.name).count();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }
}

async function runTransaction(callback) {
    const database = getDb();

    const transaction = {
        get: async (docRef) => {
            const pk = pkColumn(docRef.collectionName);
            const row = database.prepare(`SELECT * FROM ${assertTable(docRef.collectionName)} WHERE ${pk} = ?`).get(docRef.docId);
            return {
                exists: !!row,
                id: docRef.docId,
                data: () => deserialize(row),
                ref: docRef,
            };
        },
        set: (docRef, data) => {
            const { sql, values } = buildInsert(docRef.collectionName, docRef.docId, data);
            database.prepare(sql).run(...values);
        },
        update: (docRef, data) => {
            const { sql, values } = buildUpdate(docRef.collectionName, docRef.docId, data);
            database.prepare(sql).run(...values);
        },
    };

    database.prepare('BEGIN IMMEDIATE TRANSACTION').run();
    try {
        const result = await callback(transaction);
        database.prepare('COMMIT').run();
        return result;
    } catch (error) {
        database.prepare('ROLLBACK').run();
        throw error;
    }
}

function collection(name) {
    return new CollectionReference(name);
}

export const db = {
    collection,
    runTransaction,
};

export const adminDb = db;

export default db;
