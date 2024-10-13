const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { servers } = require('../../servers.json'); // Ensure this path is correct

module.exports = {
    data: new SlashCommandBuilder()
        .setName('allserverstates')
        .setDescription('Get the status of all servers with auto-refresh every minute')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        console.log('Fetching server states for all servers with embed');
        await interaction.deferReply();  // Defer reply to allow time for fetching

        const selectedServers = Object.keys(servers);
        const clearChannel = process.env.clearChannelID === 'true'; // Read the value from .env

        const fetchServerState = async (serverIp, apiToken) => {
            try {
                console.log(`Attempting to fetch server state for ${serverIp}`);
                const response = await fetch(`https://${serverIp}/api/v1`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "function": "QueryServerState" })
                });

                if (!response.ok) {
                    console.error(`Failed to fetch server state for ${serverIp}. HTTP Status: ${response.status} - ${response.statusText}`);
                    return null;
                }

                const data = await response.json();
                if (!data.data || !data.data.serverGameState) {
                    console.error(`Unexpected API response from ${serverIp}:`, JSON.stringify(data));
                    return null;
                }

                return data.data.serverGameState;

            } catch (error) {
                console.error(`Error fetching server state for ${serverIp}:`, error);
                return null;
            }
        };

        const fetchAndUpdateServerState = async () => {
            const serverStates = await Promise.all(
                selectedServers.map(async (serverName, index) => {
                    const serverIp = servers[serverName].address;
                    const apiToken = servers[serverName].token;
                    const serverState = await fetchServerState(serverIp, apiToken);

                    if (!serverState) {
                        return {
                            number: index + 1,
                            name: `${serverName}`,
                            state: 'Token Invalid',
                            players: 'N/A',
                            avgTicks: 'N/A',
                            duration: 'N/A',
                            tier: 'N/A',
                        };
                    }

                    return {
                        number: index + 1,
                        name: `${serverName}`,
                        state: serverState.isGameRunning ? 'Online' : 'Offline',
                        players: `${serverState.numConnectedPlayers || 0}/${serverState.playerLimit || 0}`,
                        avgTicks: serverState.averageTickRate ? serverState.averageTickRate.toFixed(3) : 'N/A',
                        duration: serverState.totalGameDuration
                            ? `${Math.floor(serverState.totalGameDuration / 3600)}h ${Math.floor((serverState.totalGameDuration % 3600) / 60)}m`
                            : 'N/A',
                        tier: `${serverState.techTier || 0}/9`,
                    };
                })
            );

            const lastUpdatedTime = new Date().toLocaleString();
            const serverEmbed1 = new EmbedBuilder()
                .setColor(0x0099ff)
                .setAuthor({ name: 'Satisfactory Bot', iconURL: 'https://storage.ficsit.app/file/smr-prod-s3/images/mods/DC8iF5P5v3N6C2/logo.webp' })
                .setTitle('Server Status (Part 1)')
                .setDescription('📊 Server Status with Players')
                .addFields(
                    { name: '#️⃣   Server Name', value: serverStates.map(s => `\`${s.number}. ${s.name}\``).join('\n'), inline: true },
                    { name: '📡 Status', value: serverStates.map(s => s.state === 'Online' ? '`🟢 Online`' : '`🔴 Offline`').join('\n'), inline: true },
                    { name: '👥 Players', value: serverStates.map(s => `\`${s.players}\``).join('\n'), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Last Update: ${lastUpdatedTime}` });

            const serverEmbed2 = new EmbedBuilder()
                .setColor(0x0099ff)
                .setAuthor({ name: 'Satisfactory Bot', iconURL: 'https://storage.ficsit.app/file/smr-prod-s3/images/mods/DC8iF5P5v3N6C2/logo.webp' })
                .setTitle('Server Status (Part 2)')
                .setDescription('📈 Tier, Avg Ticks, and Duration')
                .addFields(
                    { name: '#️⃣   Tier', value: serverStates.map(s => `\`${s.number}. ${s.tier}\``).join('\n'), inline: true },
                    { name: '🕒 Avg Ticks', value: serverStates.map(s => `\`${s.avgTicks}\``).join('\n'), inline: true },
                    { name: '⏳ Game Duration', value: serverStates.map(s => `\`${s.duration}\``).join('\n'), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Last Update: ${lastUpdatedTime}` });

            return [serverEmbed1, serverEmbed2];
        };

        try {
            if (clearChannel) {
                const channel = interaction.channel;
                const messages = await channel.messages.fetch();
                await channel.bulkDelete(messages);
                console.log('Channel cleared before posting new embeds.');
            }

            const initialEmbeds = await fetchAndUpdateServerState();
            const message = await interaction.editReply({ embeds: initialEmbeds, fetchReply: true });

            const interval = setInterval(async () => {
                try {
                    const updatedEmbeds = await fetchAndUpdateServerState();
                    await message.edit({ embeds: updatedEmbeds });
                } catch (error) {
                    console.error('Error updating the message with new embeds:', error.message);
                    clearInterval(interval);  // Stop interval on failure
                }
            }, 120000);  // Update every 2 minutes

        } catch (error) {
            console.error('Error fetching initial server states or posting the message:', error.message);
        }
    }
};
