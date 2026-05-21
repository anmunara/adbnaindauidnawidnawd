// Store all active store messages for broadcast updates
const activeStoreMessages = new Map();

function addStoreMessage(messageId, channelId, message) {
    activeStoreMessages.set(messageId, {
        channelId,
        message,
        timestamp: Date.now()
    });
    console.log(`[Store Messages] Added ${messageId}, total active: ${activeStoreMessages.size}`);
}

function removeStoreMessage(messageId) {
    activeStoreMessages.delete(messageId);
    console.log(`[Store Messages] Removed ${messageId}, total active: ${activeStoreMessages.size}`);
}

function getAllStoreMessages() {
    return Array.from(activeStoreMessages.entries());
}

function clearOldMessages(maxAge = 10 * 60 * 1000) { // 10 minutes
    const now = Date.now();
    let cleared = 0;
    for (const [id, data] of activeStoreMessages) {
        if (now - data.timestamp > maxAge) {
            activeStoreMessages.delete(id);
            cleared++;
        }
    }
    if (cleared > 0) {
        console.log(`[Store Messages] Cleared ${cleared} old messages`);
    }
}

module.exports = {
    addStoreMessage,
    removeStoreMessage,
    getAllStoreMessages,
    clearOldMessages,
    activeStoreMessages
};
