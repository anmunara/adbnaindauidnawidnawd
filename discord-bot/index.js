const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('./firebase-config');
const { createInvoice } = require('./utils/duitku');
const { updateStockCache, decrementStock, incrementStock, refreshStockFromDB, getStockCache } = require('./utils/stockCache');
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
        const stockMap = getStockCache();
        const typesSnap = await db.collection('game_types').orderBy('createdAt', 'desc').get();
        
        // Build components once
        const { buildStoreEmbed } = require('./commands/store');
        const { ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
        
        const embed = await buildStoreEmbed(typesSnap, stockMap);
        
        // Build dropdown
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('shop_select')
            .setPlaceholder('🔻 Pilih Paket Cloudphone Di Sini...');

        typesSnap.forEach((doc) => {
            const data = doc.data();
            const price = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(data.sellingPrice || 0);
            const stock = stockMap[doc.id] || 0;

            selectMenu.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`${data.name} - ${price}`)
                    .setDescription(`Stok: ${stock} unit | Klik untuk membeli`)
                    .setValue(`buy_${doc.id}`)
                    .setEmoji(stock > 0 ? '📦' : '❌')
            );
        });

        const refreshButton = new ButtonBuilder()
            .setCustomId('refresh_store')
            .setLabel('🔄 Refresh Stock')
            .setStyle(ButtonStyle.Secondary);
        
        const buttonRow = new ActionRowBuilder().addComponents(refreshButton);
        const selectRow = new ActionRowBuilder().addComponents(selectMenu);

        // Update all messages
        let successCount = 0;
        let failCount = 0;
        
        for (const [messageId, data] of storeMessages) {
            try {
                const channel = await client.channels.fetch(data.channelId);
                if (!channel) {
                    removeStoreMessage(messageId);
                    continue;
                }
                
                const message = await channel.messages.fetch(messageId);
                if (!message) {
                    removeStoreMessage(messageId);
                    continue;
                }
                
                await message.edit({ 
                    embeds: [embed], 
                    components: [selectRow, buttonRow] 
                });
                successCount++;
            } catch (err) {
                // Message might be deleted or inaccessible
                if (err.code === 10008) { // Unknown Message
                    removeStoreMessage(messageId);
                }
                failCount++;
            }
        }
        
        console.log(`[Broadcast] Success: ${successCount}, Failed: ${failCount}`);
    } catch (err) {
        console.error('[Broadcast] Error:', err);
    }
}

// Helper: Refresh specific store display message (for single updates)
async function refreshStoreDisplay() {
    await broadcastStockUpdate();
}

// Helper: Build fresh store dropdown from Firestore (using real-time cache)
async function buildStoreDropdown() {
    const { getStockCache } = require('./utils/stockCache');
    const typesSnap = await db.collection('game_types').orderBy('createdAt', 'desc').get();
    
    // Use real-time stock cache instead of querying every time
    const stockMap = getStockCache();

    const menu = new StringSelectMenuBuilder()
        .setCustomId('shop_select')
        .setPlaceholder('🔻 Pilih Paket Cloudphone Di Sini...');

    typesSnap.forEach(doc => {
        const d = doc.data();
        const p = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(d.sellingPrice || 0);
        const s = stockMap[doc.id] || 0;
        menu.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(`${d.name} - ${p}`)
                .setDescription(`Stok: ${s} unit | Klik untuk membeli`)
                .setValue(`buy_${doc.id}`)
                .setEmoji(s > 0 ? '📦' : '❌')
        );
    });

    return new ActionRowBuilder().addComponents(menu);
}

// Event: Ready
client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    // Setup real-time stock listener
    setupRealtimeStockListener();
    console.log('[Bot] Real-time stock listener initialized');
});

// Real-time Stock Listener: Listen to redeem_codes changes
async function setupRealtimeStockListener() {
    try {
        // Unsubscribe from previous listener if exists
        if (stockUnsubscribe) {
            stockUnsubscribe();
        }

        // Subscribe to real-time updates of redeem_codes
        let isFirstSnapshot = true;

        stockUnsubscribe = db.collection('redeem_codes').onSnapshot(snapshot => {
            // Update stock cache
            const newStockMap = {};

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.typeId && !data.isUsed) { // Only count unused codes
                    newStockMap[data.typeId] = (newStockMap[data.typeId] || 0) + 1;
                }
            });

            console.log('[Stock Update] Real-time stock sync:', newStockMap);
            updateStockCache(newStockMap);

            // Skip broadcast on initial snapshot (bot startup) to avoid unnecessary updates
            if (isFirstSnapshot) {
                isFirstSnapshot = false;
                return;
            }

            // Broadcast stock change to all active store embeds
            broadcastStockUpdate().catch(err => {
                console.error('[Stock Update] Broadcast failed:', err);
            });
        }, error => {
            console.error('[Stock Listener Error]:', error);
            // Retry after 5 seconds
            setTimeout(setupRealtimeStockListener, 5000);
        });
    } catch (error) {
        console.error('[Stock Listener Setup Error]:', error);
    }
}

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
                // Refresh stock from DB first
                await refreshStockFromDB(db);
                
                // Broadcast update to ALL store messages
                await broadcastStockUpdate();
                
                await interaction.editReply('✅ Stock refreshed for all users!');
            } catch (err) {
                console.error('[Refresh Button Error]:', err);
                await interaction.editReply('❌ Failed to refresh stock.');
            }
            return;
        }

        // Cek Status Pembayaran button
        if (customId.startsWith('cek_status_')) {
            await interaction.deferReply({ ephemeral: true });
            const orderId = customId.replace('cek_status_', '');

            try {
                const txDoc = await db.collection('transactions').doc(orderId).get();

                if (!txDoc.exists) {
                    return interaction.editReply('❌ Order tidak ditemukan.');
                }

                const tx = txDoc.data();
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
                        { name: '💰 Jumlah', value: `Rp ${(tx.amount || 0).toLocaleString('id-ID')}`, inline: true },
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

        // Other buy buttons (placeholder)
        else if (customId.startsWith('buy_')) {
            await interaction.reply({ content: `Fitur pembelian untuk item ID ${customId.split('_')[1]} akan segera hadir!`, ephemeral: true });
        }
    }

    // Handle Dropdown Menu (Shop Select)
    else if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'shop_select_rf' || interaction.customId === 'shop_select_rbxg') {
            await interaction.deferReply({ ephemeral: true });

            const selectedValue = interaction.values[0];
            if (selectedValue.startsWith('buy_')) {
                const docId = selectedValue.split('_')[1];

                try {
                    // 1. Fetch Product Details & Check Stock
                    const productRef = db.collection('game_types').doc(docId);
                    const productDoc = await productRef.get();

                    if (!productDoc.exists) {
                        return interaction.editReply('❌ Produk tidak ditemukan.');
                    }

                    const productData = productDoc.data();

                    const price = productData.sellingPrice;
                    const paymentAmount = Math.ceil(price * 1.007); // +0.7% fee included
                    const merchantOrderId = `CP-${Date.now()}-${interaction.user.id.slice(-4)}`;

                    // Check stock availability (no reserve, just check)
                    const stockCheck = await db.collection('redeem_codes')
                        .where('typeId', '==', docId)
                        .where('isUsed', '==', false)
                        .limit(1)
                        .get();

                    if (stockCheck.empty) {
                        return interaction.editReply('❌ **Stok Habis!** Silahkan tunggu restock.');
                    }

                    // 2. Create Transaction in Firestore
                    await db.collection('transactions').doc(merchantOrderId).set({
                        userId: interaction.user.id,
                        username: interaction.user.username,
                        itemId: docId,
                        itemName: productData.name,
                        price: paymentAmount,
                        merchantOrderId: merchantOrderId,
                        status: 'PENDING',
                        createdAt: new Date(),
                        delivered: null,
                        paymentUrl: ''
                    });

                    // 3. Generate Duitku Payment (v2/inquiry - Direct QR Generation)
                    if (!process.env.DUITKU_MERCHANT_CODE || !process.env.DUITKU_API_KEY) {
                        return interaction.editReply('⚠️ Sistem pembayaran belum dikonfigurasi. Hubungi Admin.');
                    }

                    let paymentData;
                    try {
                        // v2/inquiry: Generate QR langsung dengan SQ (QRIS)
                        paymentData = await createInvoice(
                            interaction.user.id,
                            productData.name,
                            paymentAmount,
                            merchantOrderId,
                            'customer@discord.com',
                            'SQ' // QRIS
                        );

                        await db.collection('transactions').doc(merchantOrderId).update({
                            qrString: paymentData.qrString || '',
                            vaNumber: paymentData.vaNumber || '',
                            reference: paymentData.reference || '',
                            expiryTime: paymentData.expiryTime || '',
                            paymentMethod: 'SQ'
                        });
                    } catch (paymentError) {
                        console.error("Payment Gen Error:", paymentError);
                        return interaction.editReply(`❌ Gagal membuat pembayaran. Detail: ${paymentError.message}`);
                    }

                    // 4. Send QR Code to Discord DM
                    // Use expiryTime from Duitku API response (convert if needed)
                    let expiryTime = paymentData.expiryTime;
                    
                    // If expiryTime is a timestamp string, convert to Unix timestamp
                    if (typeof expiryTime === 'string') {
                        expiryTime = Math.floor(new Date(expiryTime).getTime() / 1000);
                    }
                    
                    // Fallback to 10 minutes if not provided
                    if (!expiryTime) {
                        expiryTime = Math.floor(Date.now() / 1000) + (10 * 60);
                    }
                    
                    // Create QR Code image URL
                    const qrImageUrl = paymentData.qrString 
                        ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentData.qrString)}`
                        : null;

                    // QR Code Discord Embed
                    const dmEmbed = new EmbedBuilder()
                        .setColor(0x00AA00)
                        .setTitle('📱 TAGIHAN PEMBAYARAN QRIS')
                        .setDescription(`Halo **${interaction.user.username}**,\nSilakan scan QR Code di bawah untuk membayar.\n\n✅ **Metode:** QRIS (Semua E-Wallet)\n⏳ **Expired:** <t:${expiryTime}:R>`)
                        .addFields(
                            { name: '📦 Item', value: productData.name, inline: true },
                            { name: '💰 Total', value: `Rp ${paymentAmount.toLocaleString('id-ID')}`, inline: true },
                            { name: '⏰ Batas Bayar', value: `<t:${expiryTime}:T>`, inline: false },
                            { name: '📱 Cara Bayar', value: '1. Buka e-wallet Anda (GoPay, OVO, Dana, ShopeePay, LinkAja, dll)\n2. Scan QR Code di atas\n3. Ikuti instruksi pembayaran\n4. Kode akan otomatis dikirim setelah bayar ✔️' }
                        )
                        .setImage(qrImageUrl)
                        .setFooter({ text: `Order: ${merchantOrderId}` });

                    // Button: Cek Status Pembayaran
                    const statusButton = new ButtonBuilder()
                        .setCustomId(`cek_status_${merchantOrderId}`)
                        .setLabel('📋 Cek Status Pembayaran')
                        .setStyle(ButtonStyle.Success);

                    const buttonRow = new ActionRowBuilder().addComponents(statusButton);

                    try {
                        const dmMsg = await interaction.user.send({ embeds: [dmEmbed], components: [buttonRow] });
                        // Save DM message ID for reference
                        await db.collection('transactions').doc(merchantOrderId).update({
                            dmMessageId: dmMsg.id,
                            dmChannelId: dmMsg.channel.id
                        });
                        
                        await interaction.editReply(`✅ **Pembayaran Berhasil Dibuat!**\nSilahkan cek **DM Discord** Anda untuk scan QRIS.\n\n*(Jika DM tertutup, tolong buka dulu)*`);
                    } catch (dmError) {
                        await interaction.editReply({
                            content: '⚠️ Gagal mengirim DM. Pastikan DM Anda terbuka.',
                            ephemeral: true
                        });
                    }

                    // 5. Reset Dropdown & Save Message Reference
                    try {
                        const originalMessage = interaction.message;
                        if (originalMessage) {
                            storeMessageRef = originalMessage;
                            const freshRow = await buildStoreDropdown();
                            await originalMessage.edit({ components: [freshRow] });
                            console.log('[Shop] Dropdown refreshed after purchase');
                        }
                    } catch (resetErr) {
                        console.error("Dropdown Reset Error:", resetErr);
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
// Transaction Listener (Real-time Delivery)
// ---------------------------------------------
const transactionListener = db.collection('transactions')
    .where('status', '==', 'SUCCESS')
    .where('delivered', '==', null)
    .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
            if (change.type === 'added' || change.type === 'modified') {
                const docId = change.doc.id;
                const data = change.doc.data();

                // Anti-duplicate: skip if already being delivered
                if (deliveringSet.has(docId)) return;
                if (data.delivered) return;

                // Lock this order
                deliveringSet.add(docId);

                try {
                    // Double-check from DB (in case of race)
                    const freshDoc = await db.collection('transactions').doc(docId).get();
                    const freshData = freshDoc.data();
                    if (freshData.delivered) {
                        deliveringSet.delete(docId);
                        return;
                    }

                    const user = await client.users.fetch(data.userId);
                    if (user) {
                        const embed = new EmbedBuilder()
                            .setColor(0x00FF00)
                            .setTitle('📦 PESANAN DITERIMA!')
                            .setDescription(`Terima kasih **${data.username}**, pembayaran Anda telah terkonfirmasi.`)
                            .addFields(
                                { name: 'Item', value: data.itemName, inline: true },
                                { name: 'Order ID', value: data.merchantOrderId, inline: true },
                                { name: '🔑 KODE AKSES ANDA', value: `\`\`\`${data.redeemCode || 'Hubungi Admin'}\`\`\`` }
                            )
                            .setFooter({ text: 'Simpan kode ini baik-baik! • Cloudphone Manager' })
                            .setTimestamp();

                        await user.send({ embeds: [embed] });
                        console.log(`Delivered code to ${data.username} (${data.userId})`);

                        // Delete old QRIS DM to keep chat clean
                        if (data.dmMessageId && data.dmChannelId) {
                            try {
                                const dmChannel = await client.channels.fetch(data.dmChannelId);
                                const oldMsg = await dmChannel.messages.fetch(data.dmMessageId);
                                await oldMsg.delete();
                                console.log(`Deleted QRIS DM for ${docId}`);
                            } catch (delErr) {
                                console.error('Failed to delete QRIS DM:', delErr.message);
                            }
                        }

                        // Update transaction as delivered
                        await db.collection('transactions').doc(docId).update({
                            delivered: true,
                            deliveredAt: new Date()
                        });

                        // 🔄 UPDATE STOCK CACHE - Decrement stock for the item type
                        if (data.itemId) {
                            decrementStock(data.itemId);
                            console.log(`[Delivery] Stock decremented for type: ${data.itemId}`);
                        }

                        // 🔄 BROADCAST STOCK UPDATE to ALL active store messages
                        try {
                            await broadcastStockUpdate();
                        } catch (broadcastErr) {
                            console.error('Failed to broadcast stock update:', broadcastErr);
                        }
                    }
                } catch (error) {
                    console.error(`Failed to deliver code to ${data.userId}:`, error);
                } finally {
                    deliveringSet.delete(docId);
                }
            }
        });
    }, error => {
        console.error("Transaction Listener Error:", error);
    });
