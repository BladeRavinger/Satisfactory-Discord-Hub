const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { servers } = require('../../servers.json'); // Import your servers.json

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverstatus')
        .setDescription('Get the status of a specific server with auto-refresh every minute')
        .addStringOption(option =>
            option.setName('server')
                .setDescription('Select a server to view its status')
                .setRequired(true)
                .addChoices(
                    Object.entries(servers).slice(0, 25).map(([serverName, serverIp]) => ({
                        name: serverName,
                        value: serverName
                    }))
                )
        ),
    async execute(interaction, apiToken) {
        const selectedServer = interaction.options.getString('server');
        const serverIp = servers[selectedServer];

        if (!serverIp) {
            await interaction.reply(`Server IP for ${selectedServer} not found.`);
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
                    .setTitle(`${selectedServer} Status`)
                    .setDescription('Server Unresponsive')
                    .addFields(
                        { name: 'Players', value: 'N/A', inline: true },
                        { name: 'Avg Ticks', value: 'N/A', inline: true },
                        { name: 'Game Duration', value: 'N/A', inline: true }
                    )
                    .setTimestamp();
            }

            const gameDuration = serverState.totalGameDuration
                ? `${Math.floor(serverState.totalGameDuration / 3600)}h ${Math.floor((serverState.totalGameDuration % 3600) / 60)}m`
                : 'N/A';

            return new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(`${selectedServer} Status`)
                .setDescription('Server Online')
                .addFields(
                    { name: 'Players', value: `${serverState.numConnectedPlayers || 0}/${serverState.playerLimit || 0}`, inline: true },
                    { name: 'Avg Ticks', value: serverState.averageTickRate ? serverState.averageTickRate.toFixed(3) : 'N/A', inline: true },
                    { name: 'Game Duration', value: gameDuration, inline: true }
                )
                .setTimestamp();
        };

        // Send the initial embed
        const initialEmbed = await fetchAndUpdateServerState();
        const message = await interaction.reply({ embeds: [initialEmbed], fetchReply: true });

        // Set up an interval to update the embed every minute
        const interval = setInterval(async () => {
            const updatedEmbed = await fetchAndUpdateServerState();
            await message.edit({ embeds: [updatedEmbed] });
        }, 60000); // 60000 ms = 1 minute

        /* Uncomment to stop after a set duration */
        // setTimeout(() => clearInterval(interval), 10 * 60000); // Stops after 10 minutes
    }
};
