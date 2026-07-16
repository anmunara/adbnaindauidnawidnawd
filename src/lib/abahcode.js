// Abahcode Shop Developer API client.
//
// Abahcode is a dropship supplier: we don't hold stock for its products.
// When a customer pays (via Duitku), we call placeOrder() here to buy the
// voucher on-demand — this deducts our Abahcode balance and returns the
// voucher code(s) instantly, which we then deliver to the customer.
//
// Auth: every request carries the `X-API-KEY` header.
// Base:  https://abahcode.com/api/v1.php?action=<balance|products|order|status>
//
// NOTE: this is real money — placeOrder() deducts balance. Callers MUST make
// the call idempotent (claim the order first) so a retried payment callback
// can never buy twice.

const API_URL = process.env.ABAHCODE_API_URL || 'https://abahcode.com/api/v1.php';
const API_KEY = process.env.ABAHCODE_API_KEY || '';

function assertConfigured() {
    if (!API_KEY) {
        throw new Error('ABAHCODE_API_KEY not configured');
    }
}

async function request(action, { method = 'GET', body = null } = {}) {
    assertConfigured();

    const url = `${API_URL}?action=${encodeURIComponent(action)}`;
    const headers = { 'X-API-KEY': API_KEY };
    if (body) headers['Content-Type'] = 'application/json';

    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let json;
    try {
        json = JSON.parse(text);
    } catch {
        throw new Error(`Abahcode ${action}: non-JSON response (HTTP ${res.status})`);
    }

    if (!res.ok || json.status !== true) {
        const msg = json?.message || `HTTP ${res.status}`;
        const err = new Error(`Abahcode ${action} failed: ${msg}`);
        err.response = json;
        err.httpStatus = res.status;
        throw err;
    }

    return json;
}

/** Developer profile + balance ledger + tier. */
export async function getBalance() {
    const json = await request('balance');
    return json.data; // { user_id, name, email, whatsapp, balance, tier_id, tier_name }
}

/**
 * Full product catalog with tier-resolved prices and real-time stock.
 * Returns an array of { id, name, category_name, price, stock }.
 */
export async function getProducts() {
    const json = await request('products');
    return Array.isArray(json.data) ? json.data : [];
}

/**
 * Place an order for one or more products. Deducts balance and returns
 * voucher codes immediately.
 *
 * @param {Array<{product_id: number|string, qty: number}>} items
 * @returns {Promise<{ invoice_no, status, amount, items, vouchers }>}
 *   vouchers: [{ code, product_name }]
 */
export async function placeOrder(items) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('placeOrder requires a non-empty items array');
    }
    const normalized = items.map((it) => ({
        product_id: Number(it.product_id),
        qty: Math.max(1, Math.floor(Number(it.qty) || 1)),
    }));
    const json = await request('order', { method: 'POST', body: { items: normalized } });
    return json.data;
}

/**
 * Live stock for a single Abahcode product id. Throws if the catalog can't be
 * fetched — callers decide whether to fail-closed (treat as out of stock).
 */
export async function getStock(productId) {
    const catalog = await getProducts();
    const match = catalog.find((p) => String(p.id) === String(productId));
    return match ? (Number(match.stock) || 0) : 0;
}

/** Convenience: buy a single product (qty 1) and return its voucher code. */
export async function buySingle(productId) {
    const data = await placeOrder([{ product_id: productId, qty: 1 }]);
    const code = data?.vouchers?.[0]?.code || null;
    return { code, invoiceNo: data?.invoice_no || null, raw: data };
}

/** Check the status of a previously placed Abahcode order. */
export async function checkStatus(invoiceNo) {
    const json = await request(`status&invoice_no=${encodeURIComponent(invoiceNo)}`);
    return json.data;
}

export const abahcode = { getBalance, getProducts, placeOrder, buySingle, checkStatus };
export default abahcode;
