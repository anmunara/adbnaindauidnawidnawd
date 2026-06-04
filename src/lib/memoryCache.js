// Tiny in-process TTL cache.
// Persists across requests within a single server instance (module singleton).
// Used to absorb high-frequency polling (e.g. the Discord bot hitting
// /api/products/get every 15s) without re-reading Firestore each time.

const store = new Map();

/**
 * Returns the cached value for `key` if it exists and is younger than `ttlMs`.
 * Otherwise returns undefined.
 */
export function cacheGet(key, ttlMs) {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.t > ttlMs) {
        store.delete(key);
        return undefined;
    }
    return entry.v;
}

/** Stores `value` under `key` with the current timestamp. */
export function cacheSet(key, value) {
    store.set(key, { v: value, t: Date.now() });
}

/**
 * Returns the cached value for `key` ignoring TTL, or undefined if never set.
 * Used for "last known good" fallback reads (e.g. serving stale data when an
 * upstream like Firestore errors out).
 */
export function cachePeek(key) {
    const entry = store.get(key);
    return entry ? entry.v : undefined;
}

/** Removes a single key (optional manual invalidation). */
export function cacheDelete(key) {
    store.delete(key);
}

/**
 * Removes every key starting with any of the given prefixes.
 * Used to invalidate list/analytics caches after a mutation so the admin UI
 * reflects changes immediately instead of after the TTL.
 */
export function cacheDeletePrefix(...prefixes) {
    for (const key of store.keys()) {
        if (prefixes.some((p) => key.startsWith(p))) {
            store.delete(key);
        }
    }
}

/**
 * Invalidate all admin-facing caches (codes/types/orders lists, analytics)
 * plus the public products feed. Call after any write to those collections.
 */
export function bustCatalogCache() {
    cacheDeletePrefix('admin:codes:list:', 'admin:orders:list:', 'analytics:', 'products:get');
}
