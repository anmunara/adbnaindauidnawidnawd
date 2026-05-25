const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getStockCache } = require('../utils/stockCache');
const { addStoreMessage, clearOldMessages } = require('../utils/storeMessages');

const WEB_API_URL = 'http://localhost:3000';

async function fetchProducts(category) {
    try {
        const res = await fetch(`${WEB_API_URL}/api/products/get`);
        const json = await res.json();
        if (json.success) {
            return json.data.filter(p => (p.category || 'redfinger') === category);
        }
        return [];
    } catch (err) {
        console.error('[Fetch Products Error]:', err.message);
        return [];
    }
}

// Build embed from product objects (fetched from web API)
function buildStoreEmbedFromProducts(products) {
    const embed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('🔴 RedFinger Cloudphone')
        .setDescription('Select a package below to purchase')
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
        .setColor(0xE74C3C)
        .setTitle('🔴 RedFinger Cloudphone')
        .setDescription('Select a package below to purchase')
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
        .setName('rf')
        .setDescription('🔴 RedFinger Cloudphone Store - Instant Delivery'),
    buildStoreEmbed,
    async execute(interaction) {
        await interaction.deferReply();

        try {
            clearOldMessages();

            const products = await fetchProducts('redfinger');

            if (products.length === 0) {
                return await interaction.editReply('❌ **Toko sedang tutup.** Belum ada produk yang tersedia.');
            }

            const stockMap = {};
            products.forEach(p => { stockMap[p.id] = p.stock || 0; });

            const embed = buildStoreEmbedFromProducts(products);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('shop_select_rf')
                .setPlaceholder('💳 Select a package to purchase');

            products.forEach((p) => {
                const price = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.sellingPrice || 0);
                const stock = p.stock || 0;
                selectMenu.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`${p.name} - ${price}`)
                        .setDescription(`Stok: ${stock} unit | Klik untuk membeli`)
                        .setValue(`buy_${p.id}`)
                        .setEmoji(stock > 0 ? '📦' : '❌')
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
            await interaction.editReply('Failed to load store data. Please try again later.');
        }
    },
};
