const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getStockCache } = require('../utils/stockCache');
const { addStoreMessage, clearOldMessages } = require('../utils/storeMessages');

const WEB_API_URL = 'http://localhost:3000';

// Returns:
//   - an array of products on success ([] means the API genuinely returned zero products)
//   - null when the request FAILED (network error or {success:false})
async function fetchProducts(category) {
    try {
        const res = await fetch(`${WEB_API_URL}/api/products/get`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
            return json.data.filter(p => (p.category || 'redfinger') === category);
        }
        return null;
    } catch (err) {
        console.error('[Fetch Products Error]:', err.message);
        return null;
    }
}

// Fetch with one retry: the upstream API may be briefly rate-limited.
async function fetchProductsWithRetry(category) {
    let products = await fetchProducts(category);
    if (products === null) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        products = await fetchProducts(category);
    }
    return products;
}

function buildStoreEmbedFromProducts(products) {
    const embed = new EmbedBuilder()
        .setColor(0xFF6B00)
        .setTitle('🎮 Roblox Gift Cards')
        .setDescription('Select a gift card below to purchase')
        .setFooter({ text: 'Stock updates automatically' });

    for (const p of products) {
        const price = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.sellingPrice || 0);
        const stock = p.stock || 0;
        const statusEmoji = stock > 0 ? '✅' : '❌';

        embed.addFields({
            name: `${p.name}`,
            value: `${price} • ${statusEmoji} ${stock} available`,
            inline: false
        });
    }

    return embed;
}

// Legacy buildStoreEmbed for broadcast compatibility
async function buildStoreEmbed(typesSnapshot, stockMap) {
    const embed = new EmbedBuilder()
        .setColor(0xFF6B00)
        .setTitle('🎮 Roblox Gift Cards')
        .setDescription('Select a gift card below to purchase')
        .setFooter({ text: 'Stock updates automatically' });

    for (const doc of typesSnapshot.docs) {
        const data = doc.data();
        const price = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(data.sellingPrice || 0);
        const stock = stockMap[doc.id] || 0;
        const statusEmoji = stock > 0 ? '✅' : '❌';

        embed.addFields({
            name: `${data.name}`,
            value: `${price} • ${statusEmoji} ${stock} available`,
            inline: false
        });
    }

    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rbxg')
        .setDescription('🎮 Roblox Gift Cards - Instant Delivery'),
    buildStoreEmbed,
    async execute(interaction) {
        await interaction.deferReply();

        try {
            clearOldMessages();

            const products = await fetchProductsWithRetry('roblox');

            // null = the API request failed (e.g. rate-limited). Show a transient message
            // instead of "Store Closed" so users know to retry.
            if (products === null) {
                return await interaction.editReply('⚠️ Toko sedang sibuk, coba lagi sebentar lagi.');
            }

            if (products.length === 0) {
                return await interaction.editReply('❌ **Store Closed.** No gift cards available at the moment.');
            }

            const embed = buildStoreEmbedFromProducts(products);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('shop_select_rbxg')
                .setPlaceholder('💳 Select a gift card to purchase');

            products.forEach((p) => {
                const price = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.sellingPrice || 0);
                const stock = p.stock || 0;
                selectMenu.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`${p.name} - ${price}`)
                        .setDescription(`Stock: ${stock} available | Click to buy`)
                        .setValue(`buy_${p.id}`)
                        .setEmoji(stock > 0 ? '🎁' : '❌')
                );
            });

            const selectRow = new ActionRowBuilder().addComponents(selectMenu);

            const message = await interaction.editReply({
                embeds: [embed],
                components: [selectRow]
            });

            addStoreMessage(message.id, message.channelId, message);

        } catch (error) {
            console.error('Error fetching store data:', error);
            await interaction.editReply('Failed to load gift cards. Please try again later.');
        }
    },
};
