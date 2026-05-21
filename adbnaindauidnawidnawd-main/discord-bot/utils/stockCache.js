// Shared stock cache for real-time stock synchronization
let stockCache = {};

function getStockCache() {
    return stockCache;
}

function updateStockCache(newCache) {
    stockCache = { ...newCache };
}

function getStockForType(typeId) {
    return stockCache[typeId] || 0;
}

// Decrement stock when a code is sold
function decrementStock(typeId) {
    if (stockCache[typeId] && stockCache[typeId] > 0) {
        stockCache[typeId]--;
        console.log(`[Stock Cache] Decremented stock for ${typeId}: ${stockCache[typeId]} remaining`);
        return true;
    }
    return false;
}

// Increment stock when a code is added/restocked
function incrementStock(typeId) {
    stockCache[typeId] = (stockCache[typeId] || 0) + 1;
    console.log(`[Stock Cache] Incremented stock for ${typeId}: ${stockCache[typeId]} total`);
}

// Force refresh stock from Firestore (async)
async function refreshStockFromDB(db) {
    try {
        const codesSnapshot = await db.collection('redeem_codes').get();
        const newStockMap = {};
        
        codesSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.typeId && !data.isUsed) {
                newStockMap[data.typeId] = (newStockMap[data.typeId] || 0) + 1;
            }
        });
        
        stockCache = newStockMap;
        console.log('[Stock Cache] Refreshed from DB:', newStockMap);
        return newStockMap;
    } catch (error) {
        console.error('[Stock Cache] Error refreshing:', error);
        return stockCache;
    }
}

module.exports = {
    getStockCache,
    updateStockCache,
    getStockForType,
    decrementStock,
    incrementStock,
    refreshStockFromDB
};
