const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { servers } = require('../../servers.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Restart a Server')
        .addStringOption(option =>
            option.setName('server')
                .setDescription('Select the server to restart')
                .setRequired(true)
                .addChoices(
                    Object.entries(servers).slice(0, 25).map(([serverName]) => ({
                        name: serverName,
                        value: serverName
                    }))
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),

    async execute(interaction) {
        // Get the selected server
        const selectedServer = interaction.options.getString('server');
        const serverData = servers[selectedServer];

        // Validate server data
        if (!serverData || !serverData.address || !serverData.token) {
            console.error(`Invalid server data for ${selectedServer}:`, serverData);
            return await interaction.reply(`Failed to find valid server information for ${selectedServer}`);
        }

        // Correctly access 'address' and 'token' properties
        const serverIp = serverData.address;
        const apiToken = serverData.token;

        console.log(`Selected server: ${selectedServer}, IP: ${serverIp}`);

        // Defer reply early to prevent timeout issues
        await interaction.deferReply();

        // Rest of your code remains the same...
        // (Continue with your fetch functions and error handling)

        // Fetch current session name
        const fetchCurrentSession = async () => {
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
                    console.error('Unexpected API response while querying session name', data);
                    return null;
                }

                return data.data.serverGameState.activeSessionName;

            } catch (error) {
                console.error('Error querying session name', error);
                return null;
            }
        };

        // Fetch save name
        const fetchSaveName = async () => {
            try {
                const response = await fetch(`https://${serverIp}/api/v1`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "function": "EnumerateSessions" })
                });

                const data = await response.json();

                if (!data.data || !data.data.sessions) {
                    console.error('Unexpected API response while fetching sessions', data);
                    return null;
                }

                const currentSession = await fetchCurrentSession();
                const session = data.data.sessions.find(obj => obj.sessionName === currentSession);

                if (!session) {
                    await interaction.editReply('Failed to fetch save files.');
                    return null;
                }

                // Find the latest save
                let latestSave = session.saveHeaders.reduce((latest, current) => {
                    return (current.saveDateTime > latest.saveDateTime) ? current : latest;
                }, session.saveHeaders[0]);

                return latestSave.saveName;

            } catch (error) {
                console.error('Error fetching save file', error);
                return null;
            }
        };

        // Save the server
        const saveServer = async () => {
            const saveName = await fetchSaveName();
            if (!saveName) {
                await interaction.editReply('Failed to save the server.');
                return;
            }
            try {
                const response = await fetch(`https://${serverIp}/api/v1`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "function": "SaveGame", "data": { "SaveName": `${saveName}_shutdown` } })
                });

                if (!response.ok) {
                    console.error('Failed to save the game on the server', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Game Save Failed. Aborting.', error);
                return null;
            }
        };

        await saveServer();

        // Run Restart
        try {
            const response = await fetch(`https://${serverIp}/api/v1`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "function": "Shutdown" })
            });

            if (response.ok) {
                await interaction.editReply('Restarting Now');
            } else {
                await interaction.editReply(`Failed to restart the server. HTTP Status: ${response.status} - ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error restarting the server', error);
            await interaction.editReply('Failed to restart the server.');
        }
    }
};
