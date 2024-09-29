const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { servers } = require('../../servers.json'); // Import your servers.json

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverstatus')
        .setDescription('📊 Get the status of a specific server with auto-refresh every minute') // Added emoji to the command description
        .addStringOption(option =>
            option.setName('server')
                .setDescription('🌐 Select a server to view its status') // Added emoji to the option description
                .setRequired(true)
                .addChoices(
                    Object.entries(servers).slice(0, 25).map(([serverName, serverIp]) => ({
                        name: `🌍 ${serverName}`, // Added emoji to each server name
                        value: serverName
                    }))
                )
        ),
    async execute(interaction) {
        const selectedServer = interaction.options.getString('server');
        // Fetch the server IP from servers.json
        const serverIp = servers[selectedServer].address;
        const apiToken = servers[selectedServer].token;

        if (!serverIp) {
            await interaction.reply(`❌ Server IP for ${selectedServer} not found.`); // Added error emoji
            return;
        }

        console.log(`Fetching server status for ${selectedServer} with IP ${serverIp}`);

        // Function to query the server and return the details
        const fetchServerState = async (serverIp) => {
            try {
                const response = await fetch(`https://${serverIp}/api/v1`, {
                    method: 'POST',
                    headers: {
                        Authorization: 'Bearer ' + apiToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "function": "QueryServerState" })
                });

                const data = await response.json();

                if (data.errorCode === 'invalid_token') {
                    console.log(`Token has expired for server: ${serverIp}. Retrying with the same token...`);
                    return null;
                }

                if (!data.data || !data.data.serverGameState) {
                    console.error('Unexpected API response:', data);
                    return null;
                }

                return data.data.serverGameState;

            } catch (error) {
                console.error('Error fetching server state:', error);
                return null;
            }
        };

        // Function to fetch and update server state
        const fetchAndUpdateServerState = async () => {
            const serverState = await fetchServerState(serverIp);

            if (!serverState) {
                return new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle(`❌ ${selectedServer} Status`) // Added error emoji
                    .setDescription('⚠️ Server Unresponsive') // Added warning emoji
                    .setThumbnail('https://cdn2.steamgriddb.com/logo_thumb/164f4bfe061c94c60871d700d953f2f5.png') // Placeholder for thumbnail image URL
                    .addFields(
                        { name: '👥 Players', value: 'N/A', inline: true }, // Added player emoji
                        { name: '📊 Avg Ticks', value: 'N/A', inline: true }, // Added graph emoji
                        { name: '⏳ Game Duration', value: 'N/A', inline: true } // Added clock emoji
                    )
                    .setTimestamp()
                    .setFooter({
                        text: 'Server Unresponsive. Check back later!',
                        iconURL: 'https://example.com/unresponsive-icon.png' // Placeholder for footer icon URL
                    });
            }

            const gameDuration = serverState.totalGameDuration
                ? `${Math.floor(serverState.totalGameDuration / 3600)}h ${Math.floor((serverState.totalGameDuration % 3600) / 60)}m`
                : 'N/A';

            return new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(`✅ ${selectedServer} Status`) // Added checkmark emoji
                .setDescription('🟢 Server Online') // Added green circle emoji
                .setThumbnail('https://cdn2.steamgriddb.com/logo_thumb/164f4bfe061c94c60871d700d953f2f5.png') // Placeholder for thumbnail image URL
                .addFields(
                    { name: '👥 Players', value: `${serverState.numConnectedPlayers || 0}/${serverState.playerLimit || 0}`, inline: true },
                    { name: '📊 Avg Ticks', value: serverState.averageTickRate ? serverState.averageTickRate.toFixed(3) : 'N/A', inline: true },
                    { name: '⏳ Game Duration', value: gameDuration, inline: true }
                )
                .setImage('https://example.com/server-status-image.png') // Placeholder for embed image URL
                .setTimestamp()
                .setFooter({
                    text: 'Server Status Updated',
                    iconURL: 'https://example.com/footer-icon.png' // Placeholder for footer icon URL
                });
        };

        // Send the initial embed
        const initialEmbed = await fetchAndUpdateServerState();
        const message = await interaction.reply({ embeds: [initialEmbed], fetchReply: true });
    }
};
