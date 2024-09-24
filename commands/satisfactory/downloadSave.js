const { SlashCommandBuilder } = require('discord.js');
const { servers } = require('../../servers.json');
const fs = require('node:fs');
const fsPromise = require('node:fs/promises');

//this command does not work, do not run

module.exports = {
    cooldown: 3600, //1 hour
    data: new SlashCommandBuilder()
        .setName('downloadsave')
        .setDescription('Download a Server Save') //TODO: generalize
        .addStringOption(option =>
            option.setName('server')
                .setDescription('Select a server')
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
            await interaction.reply(`Server IP for ${selectedServer} not found`)
        }

        // Defer reply early to prevent timeout issues
        await interaction.deferReply();

        // Get name of current session from server
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

            } catch (error){
                console.error('Error fetching save file', error);
                return null;
            }
        };

        // Download Save and store locally
        const fetchDownloadFile = async (serverIp, downloadSaveName) => {
            try {
                const response = await fetch(`https://${serverIp}/api/v1`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiToken}`,
                        'Content-Type': 'application/json',
                        encoding: null
                    },
                    body: JSON.stringify({ "function": "DownloadSaveGame", "data": { "SaveName": `${downloadSaveName}` } })
                });

                const data = await response.arrayBuffer();

                if (!data) {
                    console.error('Unexpected API response: ', data);
                    return null
                }

                try {
                    await fsPromise.writeFile(`./fileTransfer/${downloadSaveName}.sav`, Buffer.from(data));
                } catch (error) {
                    console.error(`write failed`, error);
                }

                return data

            } catch (error) {
                console.error(`Error fetching save file`, error);
                return null;
            }
        };

        // Do all the Things
        const downloadSaveName = await fetchSaveName(serverIp);
        const saveFile = await fetchDownloadFile(serverIp, downloadSaveName);

        // Reply with the save and delete local records
        try {
            await interaction.editReply({ content: `File to download \n${downloadSaveName}`, files: [`./fileTransfer/${downloadSaveName}.sav`] });
        } catch (error) {
            console.error('Faild to Send File', error);
        }
        try {
            fs.unlinkSync(`./fileTransfer/${downloadSaveName}.sav`);
        } catch (err) {
            console.error('File Delete Failed', err);
        }
    }
}