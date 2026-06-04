const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { updateStockCache, getStockCache } = require('./utils/stockCache');
const { getAllStoreMessages, removeStoreMessage } = require('./utils/storeMessages');
const fs = require('fs');

// Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Anti-duplicate: track orders currently being delivered
const deliveringSet = new Set();

// Real-time stock listener unsubscribe
let stockUnsubscribe = null;

// Store message reference for auto-refresh
let storeMessageRef = null;

// Function to set store message reference (called from store.js)
function setStoreMessageRef(message) {
    storeMessageRef = message;
    console.log('[Store] Message reference saved for auto-refresh');
}

// Export for store.js
module.exports = { storeMessageRef, setStoreMessageRef, broadcastStockUpdate };

client.commands = new Collection();

// Load Commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    }
}

// Helper: Broadcast stock update to ALL active store messages
async function broadcastStockUpdate() {
    const storeMessages = getAllStoreMessages();
    if (storeMessages.length === 0) {
        console.log('[Broadcast] No active store messages to update');
        return;
    }

    console.log(`[Broadcast] Updating ${storeMessages.length} store messages...`);
    
    try {
        // Fetch products from local web API
        const allProducts = await fetchProductsFromWeb();
        if (!allProducts) return;

        const rfProducts = allProducts.filter(p => (p.category || 'redfinger') === 'redfinger');
        const rbxgProducts = allProducts.filter(p => (p.category || 'redfinger') === 'roblox');

        let successCount = 0;
        let failCount = 0;

        for (const [messageId, msgData] of storeMessages) {
            try {
                const channel = await client.channels.fetch(msgData.channelId);
                if (!channel) { removeStoreMessage(messageId); continue; }

                const message = await channel.messages.fetch(messageId);
                if (!message) { removeStoreMessage(messageId); continue; }

                const existingEmbed = message.embeds?.[0];
                const title = existingEmbed?.title || '';
                const isRbxg = title.includes('Roblox');
                const products = isRbxg ? rbxgProducts : rfProducts;
                const customId = isRbxg ? 'shop_select_rbxg' : 'shop_select_rf';

                if (products.length === 0) continue;

                const embed = new EmbedBuilder()
                    .setColor(isRbxg ? 0xFF6B00 : 0xE74C3C)
                    .setTitle(isRbxg ? '🎮 Roblox Gift Cards' : '🔴 RedFinger Cloudphone')
                    .setDescription(isRbxg ? 'Select a gift card below to purchase' : 'Select a package below to purchase')
                    .setFooter({ text: 'Stock updates automatically' });

                products.forEach(p => {
                    const price = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.sellingPrice || 0);
                    const stock = p.stock || 0;
                    embed.addFields({ name: p.name, value: `${price} • ${stock > 0 ? '✅' : '❌'} ${stock} available`, inline: false });
                });

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(customId)
                    .setPlaceholder(isRbxg ? '💳 Select a gift card to purchase' : '💳 Select a package to purchase');

                products.forEach(p => {
                    const price = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.sellingPrice || 0);
                    const stock = p.stock || 0;
                    selectMenu.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(`${p.name} - ${price}`)
                            .setDescription(`Stock: ${stock} available | Click to buy`)
                            .setValue(`buy_${p.id}`)
                            .setEmoji(stock > 0 ? (isRbxg ? '🎁' : '📦') : '❌')
                    );
                });

                const selectRow = new ActionRowBuilder().addComponents(selectMenu);
                await message.edit({ embeds: [embed], components: [selectRow] });
                successCount++;
            } catch (err) {
                if (err.code === 10008) { removeStoreMessage(messageId); }
                failCount++;
            }
        }

        console.log(`[Broadcast] Success: ${successCount}, Failed: ${failCount}`);
    } catch (err) {
        console.error('[Broadcast] Error:', err);
    }
}

// Fetch products from local web API (bypasses Firestore connection issues)
const WEB_API_URL = 'http://localhost:3000';

// Returns the products array on success (may be []), or null when the request
// FAILED (network error or {success:false}). Callers must treat null as "keep
// last known good" and never let it wipe the in-memory stock cache.
async function fetchProductsFromWeb() {
    try {
        const res = await fetch(`${WEB_API_URL}/api/products/get`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) return json.data;
        console.error('[Web API] Failed:', json.error);
        return null;
    } catch (err) {
        console.error('[Web API] Error:', err.message);
        return null;
    }
}

// Poll stock from web API every 60 seconds (gentle on Firestore quota).
// Stock also refreshes right after a delivery and via the "refresh_store" button.
const STOCK_POLL_BASE_MS = 60000;
const STOCK_POLL_MAX_MS = 5 * 60000; // cap backoff at 5 minutes
let stockPollTimer = null;
let stockPollFailures = 0;
let lastStockJson = '';

async function pollStockFromWeb() {
    const products = await fetchProductsFromWeb();
    if (!products) {
        // Failed fetch (null): count it for backoff and bail out WITHOUT touching
        // updateStockCache, so the last known good stock stays in memory.
        stockPollFailures++;
        return;
    }
    stockPollFailures = 0;

    const newStockMap = {};
    products.forEach(p => {
        if (p.id && p.stock !== undefined) {
            newStockMap[p.id] = p.stock;
        }
    });

    const newJson = JSON.stringify(newStockMap);
    if (newJson !== lastStockJson) {
        console.log('[Stock Poll] Stock changed:', newStockMap);
        updateStockCache(newStockMap);
        lastStockJson = newJson;

        // Broadcast update to active embeds
        broadcastStockUpdate().catch(err => {
            console.error('[Stock Poll] Broadcast failed:', err);
        });
    }
}

// Self-scheduling loop with exponential backoff on repeated failures
function scheduleStockPoll() {
    const delay = Math.min(STOCK_POLL_BASE_MS * Math.pow(2, stockPollFailures), STOCK_POLL_MAX_MS);
    if (stockPollFailures > 0) {
        console.log(`[Stock Poll] Backing off, next poll in ${Math.round(delay / 1000)}s (failures: ${stockPollFailures})`);
    }
    stockPollTimer = setTimeout(async () => {
        await pollStockFromWeb();
        scheduleStockPoll();
    }, delay);
}

// Event: Ready
client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    // Initial stock fetch + start polling
    setTimeout(async () => {
        await pollStockFromWeb();
        console.log('[Bot] Initial stock loaded from web API');

        scheduleStockPoll();
        console.log('[Bot] Stock polling started (every 60s, with backoff)');
    }, 3000); // Wait 3s for web to be ready
});

// Event: Interaction Create
client.on(Events.InteractionCreate, async interaction => {
    // Handle Slash Commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
            }
        }
    }

    // Handle Buttons
    else if (interaction.isButton()) {
        const customId = interaction.customId;

        // 🔄 Refresh Store Button
        if (customId === 'refresh_store') {
            await interaction.deferReply({ ephemeral: true });

            try {
                await pollStockFromWeb();
                await broadcastStockUpdate();
                await interaction.editReply('✅ Stock refreshed for all users!');
            } catch (err) {
                console.error('[Refresh Button Error]:', err);
                await interaction.editReply('❌ Failed to refresh stock.');
            }
            return;
        }

        // Cek Status Pembayaran button (via web API)
        if (customId.startsWith('cek_status_')) {
            await interaction.deferReply({ ephemeral: true });
            const orderId = customId.replace('cek_status_', '');

            try {
                const res = await fetch(`${WEB_API_URL}/api/bot/order-status?orderId=${encodeURIComponent(orderId)}`);
                const json = await res.json();

                if (!json.success) {
                    return interaction.editReply('❌ Order tidak ditemukan.');
                }

                const tx = json.order;
                let statusEmoji = '⏳';
                let statusText = 'Menunggu Pembayaran';
                let color = 0xFFA500;

                if (tx.status === 'SUCCESS') {
                    statusEmoji = '✅';
                    statusText = 'Pembayaran Berhasil';
                    color = 0x00FF00;
                } else if (tx.status === 'FAILED' || tx.status === 'EXPIRED') {
                    statusEmoji = '❌';
                    statusText = tx.status === 'EXPIRED' ? 'Pembayaran Kedaluwarsa' : 'Pembayaran Gagal';
                    color = 0xFF0000;
                }

                const statusEmbed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle(`${statusEmoji} Status Pembayaran`)
                    .addFields(
                        { name: '📦 Item', value: tx.itemName || '-', inline: true },
                        { name: '💰 Jumlah', value: `Rp ${(tx.price || 0).toLocaleString('id-ID')}`, inline: true },
                        { name: '📋 Status', value: `**${statusText}**`, inline: false },
                        { name: '🆔 Order ID', value: `\`${orderId}\``, inline: false }
                    )
                    .setTimestamp();

                if (tx.delivered && tx.redeemCode) {
                    statusEmbed.addFields({ name: '🔑 Kode Akses', value: `\`\`\`${tx.redeemCode}\`\`\`` });
                }

                await interaction.editReply({ embeds: [statusEmbed] });
            } catch (err) {
                console.error("Cek Status Error:", err);
                await interaction.editReply('❌ Gagal mengecek status pembayaran.');
            }
        }
    }

    // Handle Dropdown Menu (Shop Select) — via web API
    else if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'shop_select_rf' || interaction.customId === 'shop_select_rbxg') {
            await interaction.deferReply({ ephemeral: true });

            const selectedValue = interaction.values[0];
            if (selectedValue.startsWith('buy_')) {
                const docId = selectedValue.split('_')[1];

                try {
                    // 1. Create order via web API (handles product check, stock, Duitku, Firestore)
                    const orderRes = await fetch(`${WEB_API_URL}/api/bot/order-create`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: interaction.user.id,
                            username: interaction.user.username,
                            itemId: docId,
                        }),
                    });
                    const orderData = await orderRes.json();

                    if (!orderData.success) {
                        if (orderData.message === 'Out of stock') {
                            return interaction.editReply('❌ **Stok Habis!** Silahkan tunggu restock.');
                        }
                        return interaction.editReply(`❌ ${orderData.message}`);
                    }

                    // 2. Build QR embed
                    let expiryTime = orderData.expiryTime;
                    if (typeof expiryTime === 'string') {
                        expiryTime = Math.floor(new Date(expiryTime).getTime() / 1000);
                    }
                    if (!expiryTime) {
                        expiryTime = Math.floor(Date.now() / 1000) + (10 * 60);
                    }

                    const qrImageUrl = orderData.qrString
                        ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(orderData.qrString)}`
                        : null;

                    const dmEmbed = new EmbedBuilder()
                        .setColor(0x00AA00)
                        .setTitle('📱 TAGIHAN PEMBAYARAN QRIS')
                        .setDescription(`Halo **${interaction.user.username}**,\nSilakan scan QR Code di bawah untuk membayar.\n\n✅ **Metode:** QRIS (Semua E-Wallet)\n⏳ **Expired:** <t:${expiryTime}:R>`)
                        .addFields(
                            { name: '📦 Item', value: orderData.itemName, inline: true },
                            { name: '💰 Total', value: `Rp ${orderData.paymentAmount.toLocaleString('id-ID')}`, inline: true },
                            { name: '⏰ Batas Bayar', value: `<t:${expiryTime}:T>`, inline: false },
                            { name: '📱 Cara Bayar', value: '1. Buka e-wallet Anda (GoPay, OVO, Dana, ShopeePay, LinkAja, dll)\n2. Scan QR Code di atas\n3. Ikuti instruksi pembayaran\n4. Kode akan otomatis dikirim setelah bayar ✔️' }
                        )
                        .setImage(qrImageUrl)
                        .setFooter({ text: `Order: ${orderData.merchantOrderId}` });

                    const statusButton = new ButtonBuilder()
                        .setCustomId(`cek_status_${orderData.merchantOrderId}`)
                        .setLabel('📋 Cek Status Pembayaran')
                        .setStyle(ButtonStyle.Success);

                    const buttonRow = new ActionRowBuilder().addComponents(statusButton);

                    try {
                        await interaction.user.send({ embeds: [dmEmbed], components: [buttonRow] });
                        await interaction.editReply(`✅ **Pembayaran Berhasil Dibuat!**\nSilahkan cek **DM Discord** Anda untuk scan QRIS.\n\n*(Jika DM tertutup, tolong buka dulu)*`);
                    } catch (dmError) {
                        await interaction.editReply({
                            content: '⚠️ Gagal mengirim DM. Pastikan DM Anda terbuka.',
                            ephemeral: true
                        });
                    }

                } catch (err) {
                    console.error("Shop Logic Error:", err);
                    await interaction.editReply('Terjadi kesalahan sistem.');
                }
            }
        }
    }
});

// Event: Message Create (Legacy Command Support)
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content === '!setup' || message.content === '!store' || message.content === '!setup-cloudphone') {
        const storeCommand = client.commands.get('store');
        if (storeCommand) {
            const mockInteraction = {
                deferReply: async () => { },
                editReply: async (response) => message.channel.send(response),
                reply: async (response) => message.channel.send(response),
                user: message.author,
                guild: message.guild,
                channel: message.channel
            };

            try {
                await message.channel.sendTyping();
                await storeCommand.execute(mockInteraction);
            } catch (error) {
                console.error("Legacy command error:", error);
                message.reply("Gagal memuat store.");
            }
        }
    }


});

// Login
if (!process.env.DISCORD_TOKEN) {
    console.error('Error: DISCORD_TOKEN is missing in .env');
} else {
    client.login(process.env.DISCORD_TOKEN);
}

// ---------------------------------------------
// Delivery Poller (replaces broken onSnapshot)
// Polls web API every 60 seconds for paid orders.
// Adequate for small stores; cuts Firestore reads by 75% vs 15s,
// but backs off if the web API is repeatedly failing.
// ---------------------------------------------
const DELIVERY_POLL_BASE_MS = 60000;
const DELIVERY_POLL_MAX_MS = 5 * 60000; // cap backoff at 5 minutes
let deliveryPollTimer = null;
let deliveryPollFailures = 0;

async function pollPendingDeliveries() {
    try {
        const res = await fetch(`${WEB_API_URL}/api/bot/pending-deliveries`);
        const json = await res.json();
        deliveryPollFailures = 0;
        if (!json.success || !json.pending.length) return;

        for (const order of json.pending) {
            if (deliveringSet.has(order.docId)) continue;
            deliveringSet.add(order.docId);

            try {
                const user = await client.users.fetch(order.userId);
                if (user) {
                    const embed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('📦 PESANAN DITERIMA!')
                        .setDescription(`Terima kasih **${order.username}**, pembayaran Anda telah terkonfirmasi.`)
                        .addFields(
                            { name: 'Item', value: order.itemName, inline: true },
                            { name: 'Order ID', value: order.merchantOrderId, inline: true },
                            { name: '🔑 KODE AKSES ANDA', value: `\`\`\`${order.redeemCode || 'Hubungi Admin'}\`\`\`` }
                        )
                        .setFooter({ text: 'Simpan kode ini baik-baik! • Cloudphone Manager' })
                        .setTimestamp();

                    await user.send({ embeds: [embed] });
                    console.log(`[Delivery] Code sent to ${order.username} (${order.userId})`);

                    // Delete old QRIS DM
                    if (order.dmMessageId && order.dmChannelId) {
                        try {
                            const dmChannel = await client.channels.fetch(order.dmChannelId);
                            const oldMsg = await dmChannel.messages.fetch(order.dmMessageId);
                            await oldMsg.delete();
                        } catch (delErr) {
                            // Ignore - message might already be deleted
                        }
                    }

                    // Mark as delivered via web API
                    await fetch(`${WEB_API_URL}/api/bot/pending-deliveries`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ docId: order.docId }),
                    });

                    console.log(`[Delivery] Marked ${order.docId} as delivered`);

                    // Stock will refresh on next regular poll cycle (every 60s)
                    console.log(`[Delivery] Stock refresh deferred to next poll cycle`);
                }
            } catch (err) {
                console.error(`[Delivery] Failed for ${order.userId}:`, err.message);
            } finally {
                deliveringSet.delete(order.docId);
            }
        }
    } catch (err) {
        // Count failures for backoff; stay silent on transient connection drops
        deliveryPollFailures++;
        if (!err.message.includes('fetch failed')) {
            console.error('[Delivery Poll] Error:', err.message);
        }
    }
}

// Self-scheduling loop with exponential backoff on repeated failures
function scheduleDeliveryPoll() {
    const delay = Math.min(DELIVERY_POLL_BASE_MS * Math.pow(2, deliveryPollFailures), DELIVERY_POLL_MAX_MS);
    if (deliveryPollFailures > 0) {
        console.log(`[Delivery Poll] Backing off, next poll in ${Math.round(delay / 1000)}s (failures: ${deliveryPollFailures})`);
    }
    deliveryPollTimer = setTimeout(async () => {
        await pollPendingDeliveries();
        scheduleDeliveryPoll();
    }, delay);
}

// Start delivery polling after bot is ready
client.once(Events.ClientReady, () => {
    setTimeout(() => {
        scheduleDeliveryPoll();
        console.log('[Bot] Delivery polling started (every 60s, with backoff)');
    }, 5000);
});
