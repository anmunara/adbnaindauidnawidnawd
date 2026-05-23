const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../firebase-config');
const { getStockCache } = require('../utils/stockCache');
const { addStoreMessage, clearOldMessages } = require('../utils/storeMessages');

// Function to get total sold count for a type
async function getTotalSold(typeId) {
    try {
        const snapshot = await db.collection('transactions')
            .where('itemId', '==', typeId)
            .get();
        return snapshot.size;
    } catch (error) {
        console.error('[Get Total Sold Error]:', error);
        return 0;
    }
}

// Function to build embed with current stock
async function buildStoreEmbed(typesSnapshot, stockMap) {
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🔴 REDFINGER CLOUDPHONE STORE')
        .setDescription('```\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n    🌟 PREMIUM CLOUDPHONE DEVICES 🌟\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━```\n\n✅ **Live Stock Updates** • 📱 **Premium Devices**\n⚡ **Instant Delivery** • 🔒 **Secure Transactions**\n\n**Select your package below:**')
        .setThumbnail('https://media.discordapp.net/attachments/1435204509864296458/1435324989200011398/2.png?ex=698cc110&is=698b6f90&hm=2d53abde392c2419888a4971ac1452a4bb726eb32ee633d3a2deb90883df3baa&=&format=webp&quality=lossless&width=220&height=220')
        .setImage('https://media.discordapp.net/attachments/1203646271960846336/1205167688531546193/rainbow_line.gif?ex=65d75ec7&is=65c4e9c7&hm=5fa2420952d7667d49814421469735e5c740062c31c77579148d576135317711&=')
        .setTimestamp()
        .setFooter({ text: '🔄 Auto-refreshing every 30 seconds • KingBlox Store', iconURL: 'https://media.discordapp.net/attachments/1435204509864296458/1435324989200011398/2.png?ex=698cc110&is=698b6f90&hm=2d53abde392c2419888a4971ac1452a4bb726eb32ee633d3a2deb90883df3baa&=&format=webp&quality=lossless&width=220&height=220' });

    for (const doc of typesSnapshot.docs) {
        const data = doc.data();
        const price = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(data.sellingPrice || 0);
        const stock = stockMap[doc.id] || 0;
        const totalSold = await getTotalSold(doc.id);

        // Stock status indicator
        let stockStatus = '❌ Out of Stock';
        let stockBar = '`░░░░░░░░░░`';
        if (stock > 0) {
            stockStatus = `✅ ${stock} available`;
            const percentage = Math.min(stock * 10, 10);
            stockBar = '`' + '█'.repeat(Math.ceil(percentage)) + '░'.repeat(10 - Math.ceil(percentage)) + '`';
        }

        embed.addFields({
            name: `\n💎 ${data.name}`,
            value: `\`\`\`yaml\nPrice      : ${price}\nStock      : ${stock} unit(s)\nTotal Sold : ${totalSold} unit(s)\nStatus     : ${stockStatus.replace(/✅|❌/g, '')}\n${stockBar}\n\`\`\``,
            inline: false
        });
    }

    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rf')
        .setDescription('🔴 RedFinger Cloudphone Store - Instant Delivery'),
    buildStoreEmbed,
    async execute(interaction) {
        await interaction.deferReply();

        try {
            // Clear old messages periodically
            clearOldMessages();

            // Function to refresh store
            const refreshStore = async () => {
                try {
                    // 1. Fetch RedFinger Types
                    const typesSnapshot = await db.collection('game_types')
                        .where('category', '==', 'redfinger')
                        .orderBy('createdAt', 'desc')
                        .get();

                    if (typesSnapshot.empty) {
                        return await interaction.editReply('❌ **Toko sedang tutup.** Belum ada produk yang tersedia.');
                    }

                    // 2. Use real-time stock cache instead of querying
                    const stockMap = getStockCache();

                    // 3. Build Embed
                    const embed = await buildStoreEmbed(typesSnapshot, stockMap);

                    // 4. Build Dropdown
                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('shop_select_rf')
                        .setPlaceholder('💳 Select a package to purchase');

                    typesSnapshot.forEach((doc) => {
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

                    // 5. Build Action Rows
                    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

                    const message = await interaction.editReply({
                        embeds: [embed],
                        components: [selectRow]
                    });
                    
                    // 6. SAVE MESSAGE REFERENCE for auto-refresh on purchase
                    addStoreMessage(message.id, message.channelId, message);
                    
                    return message;
                } catch (error) {
                    console.error('[Store Refresh Error]:', error);
                }
            };

            // Initial load
            const message = await refreshStore();

            // Setup auto-refresh every 30 seconds
            const refreshInterval = setInterval(async () => {
                try {
                    const typesSnapshot = await db.collection('game_types')
                        .where('category', '==', 'redfinger')
                        .orderBy('createdAt', 'desc')
                        .get();
                    if (typesSnapshot.empty) return;

                    const stockMap = getStockCache();
                    const embed = await buildStoreEmbed(typesSnapshot, stockMap);

                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('shop_select_rf')
                        .setPlaceholder('💳 Select a package to purchase');

                    typesSnapshot.forEach((doc) => {
                        const data = doc.data();
                        const price = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(data.sellingPrice || 0);
                        const stock = stockMap[doc.id] || 0;

                        selectMenu.addOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel(`${data.name} - ${price}`)
                                .setDescription(`Stock: ${stock} unit | Click to buy`)
                                .setValue(`buy_${doc.id}`)
                                .setEmoji(stock > 0 ? '📦' : '❌')
                        );
                    });

                    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

                    await message.edit({ embeds: [embed], components: [selectRow] });
                } catch (err) {
                    if (err.code === 10008) {
                        // Message was deleted, silently ignore
                        return;
                    }
                    console.error('[Auto-refresh Error]:', err);
                }
            }, 30000);

            // Cleanup interval after 10 minutes (to prevent memory leak)
            setTimeout(() => {
                clearInterval(refreshInterval);
                console.log('[Store] Auto-refresh stopped after 10 minutes');
            }, 10 * 60 * 1000);

        } catch (error) {
            console.error('Error fetching store data:', error);
            await interaction.editReply('Failed to load store data. Please try again later.');
        }
    },
};
