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

module.exports = {
    getStockCache,
    updateStockCache,
    getStockForType,
    decrementStock,
    incrementStock,
};
