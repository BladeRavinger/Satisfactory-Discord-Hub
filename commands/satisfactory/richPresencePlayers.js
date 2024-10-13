const { SlashCommandBuilder, PermissionFlagsBits, ActivityType } = require('discord.js');
const { servers } = require('../../servers.json');
const { loadState, saveState } = require('../../utils/richPresenceUtils'); // Import the utils
let richPresenceInterval = null;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('richpresenceplayers')
        .setDescription('Toggle rich presence for a server with current players')
        .addStringOption(option =>
            option.setName('server')
                .setDescription('Select the server')
                .setRequired(true)
                .addChoices(
                    Object.entries(servers).map(([serverName]) => ({
                        name: serverName,
                        value: serverName
                    }))
                )
        )
        .addBooleanOption(option =>
            option.setName('enable')
                .setDescription('Enable or disable the rich presence player count')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const selectedServer = interaction.options.getString('server');
        const enable = interaction.options.getBoolean('enable');
        const serverIp = servers[selectedServer].address;
        const apiToken = servers[selectedServer].token;

        if (!serverIp) {
            await interaction.reply({ content: `Server IP for ${selectedServer} not found.`, ephemeral: true });
            return;
        }

        if (enable) {
            if (richPresenceInterval) {
                clearInterval(richPresenceInterval);
            }

            const updatePresence = async () => {
                const playerCount = await fetchPlayerCount(serverIp, apiToken);
                if (playerCount !== null) {
                    interaction.client.user.setActivity(`Online: ${playerCount}`, {
                        type: ActivityType.Playing
                    });
                    console.log(`Updated rich presence: Online ${playerCount}`);
                } else {
                    console.error('Failed to fetch player count');
                }
            };

            await updatePresence();
            richPresenceInterval = setInterval(updatePresence, 60000);

            // Save the state in the utils folder
            saveState({ enabled: true, server: selectedServer });

            await interaction.reply({ content: `Rich presence enabled for ${selectedServer}.`, ephemeral: true });

        } else {
            if (richPresenceInterval) {
                clearInterval(richPresenceInterval);
                richPresenceInterval = null;
            }

            interaction.client.user.setActivity(null);

            // Save the disabled state
            saveState({ enabled: false, server: "" });

            await interaction.reply({ content: `Rich presence disabled for ${selectedServer}.`, ephemeral: true });
        }
    }
};

// Fetch player count from the server
async function fetchPlayerCount(serverIp, apiToken) {
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

        if (!data.data || !data.data.serverGameState) {
            console.error('Unexpected API response:', data);
            return null;
        }

        return `${data.data.serverGameState.numConnectedPlayers || 0}/${data.data.serverGameState.playerLimit || 0}`;
    } catch (error) {
        console.error('Error fetching player count:', error);
        return null;
    }
}
