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
        //Get the selected server
        const selectedServer = interaction.options.getString('server');
        const serverIp = servers[selectedServer].serverIp;
        const apiToken = servers[selectedServer].key;

        // Defer reply early to prevent timeout issues
        await interaction.deferReply();

        //Get current SaveName
        const fetchCurrentSession = async (serverIp) => {
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

        //Get list of sessions form server
        const fetchSaveName = async (serverIp) => {
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

                currentSession = await fetchCurrentSession(serverIp);
                options = data.data.sessions.find(obj => obj.sessionName === currentSession);
                if (!options) {
                    await interaction.editReply('Failed to fetch save files.');
                    return;
                }

                for (i in options.saveHeaders) {
                    var memory;
                    ;
                    if (!memory) {
                        memory = options.saveHeaders[i];
                        continue;
                    }

                    if (memory.saveDateTime < options.saveHeaders[i].saveDateTime) {
                        memory = options.saveHeaders[i];
                        continue;
                    }
                }

                return memory.saveName;

            } catch (error) {
                console.error('Error fetching save file', error);
                return null;
            }
        };

        //Save the Server
        const saveServer = async (serverIp) => {
            saveName = await fetchSaveName(serverIp);
            try {
                const response = await fetch(`https://${serverIp}/api/v1`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "function": "SaveGame", "data": { "SaveName": `${saveName}_shutdown` } })
                });
                return null;
            } catch (error) {
                console.error('Game Save Failed Aborting', error);
                return null;
            }
        };


        await saveServer(serverIp);
        //Run Restart
        const response = await fetch(`https://${serverIp}/api/v1`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "function": "Shutdown" })
        });
        await interaction.editReply('Restarting Now');
    }
}