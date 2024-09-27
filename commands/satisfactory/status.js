const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { servers } = require('../../servers.json'); // Import your servers.json

module.exports = {
    data: new SlashCommandBuilder()
        .setName('allserverstates')
        .setDescription('Get the status of all servers with auto-refresh every minute'),
    async execute(interaction) {
        console.log('Fetching server states for all servers with embed');

        const selectedServers = Object.keys(servers); // Fetch all servers from the servers.json file

        // Function to query the server and return the details for each one
        const fetchServerState = async (serverIp, apiToken) => {
            try {
                const response = await fetch(`https://${serverIp}/api/v1`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "function": "QueryServerState" })
                });

                const data = await response.json();

                if (data.errorCode === 'invalid_token') {
                    console.log(`Token has expired for server: ${serverIp}. Retrying with the same token...`);
                    return null
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
            const serverStates = await Promise.all(
                selectedServers.map(async (serverName, index) => { // Added index to use for numbering
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
                            tier: 'N/A'  // Default tier value for unresponsive servers
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
                        tier: `${serverState.techTier || 0}/9` // Fetch the tier value
                    };
                })
            );

            const lastUpdatedTime = new Date().toLocaleString(); // Current time for "Last Update"

            // First Embed with numbered server names, status, and players
            const serverEmbed1 = new EmbedBuilder()
                .setColor(0x0099ff)
                .setAuthor({ name: 'Satisfactory Bot', iconURL: 'https://some-icon-url.png' }) // Add your own icon URL
                .setTitle('Server Status (Part 1)')
                .setDescription('Server Status with Players')
                .addFields(
                    { name: '#.   Server Name', value: serverStates.map(s => `${s.number}. ${s.name}`).join('\n'), inline: true },
                    { name: 'Status', value: serverStates.map(s => s.state).join('\n'), inline: true },
                    { name: 'Players', value: serverStates.map(s => s.players).join('\n'), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Last Update: ${lastUpdatedTime}`, iconURL: 'https://some-footer-icon-url.png' });

            // Second Embed with matching numbers, tier, avg ticks, and game duration
            const serverEmbed2 = new EmbedBuilder()
                .setColor(0x0099ff)
                .setAuthor({ name: 'Satisfactory Bot', iconURL: 'https://some-icon-url.png' }) // Add your own icon URL
                .setTitle('Server Status (Part 2)')
                .setDescription('Tier, Avg Ticks, and Duration')
                .addFields(
                    { name: '#.   Tier', value: serverStates.map(s => `${s.number}. ${s.tier}`).join('\n'), inline: true },
                    { name: 'Avg Ticks', value: serverStates.map(s => s.avgTicks).join('\n'), inline: true },
                    { name: 'Game Duration', value: serverStates.map(s => s.duration).join('\n'), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Last Update: ${lastUpdatedTime}`, iconURL: 'https://some-footer-icon-url.png' });

            return [serverEmbed1, serverEmbed2];
        };

        // Send the initial embeds
        const initialEmbeds = await fetchAndUpdateServerState();
        const message = await interaction.reply({ embeds: initialEmbeds, fetchReply: true });

        // Set up an interval to update the embeds every minute
        const interval = setInterval(async () => {
            const updatedEmbeds = await fetchAndUpdateServerState();
            await message.edit({ embeds: updatedEmbeds });
        }, 60000); // 60000 ms = 1 minute

        /* Uncomment to stop after a set duration */
        // setTimeout(() => clearInterval(interval), 10 * 60000); // Stops after 10 minutes
    }
};
