const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { servers } = require('../../servers.json');
const fs = require('node:fs');
const fsPromise = require('node:fs/promises');

module.exports = {
    cooldown: 3600, // 1 hour cooldown
    data: new SlashCommandBuilder()
        .setName('downloadsave')
        .setDescription('Download a Server Save')
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
            await interaction.reply(`Server IP for ${selectedServer} not found`);
            return;
        }

        // Defer the reply to allow more time for processing without ephemeral
        await interaction.deferReply();

        // Fetch the current session name from the server
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
                    return null;
                }

                return data.data.serverGameState.activeSessionName;
            } catch (error) {
                console.error('Error querying session name:', error);
                return null;
            }
        };

        // Fetch the latest save name for the current session
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
                    return null;
                }

                const currentSession = await fetchCurrentSession(serverIp);
                const sessionOptions = data.data.sessions.find(session => session.sessionName === currentSession);

                if (!sessionOptions) return null;

                // Find the most recent save based on saveDateTime
                let latestSave = sessionOptions.saveHeaders[0];
                for (const header of sessionOptions.saveHeaders) {
                    if (header.saveDateTime > latestSave.saveDateTime) {
                        latestSave = header;
                    }
                }

                return latestSave.saveName;
            } catch (error) {
                console.error('Error fetching save file:', error);
                return null;
            }
        };

        // Download the save file from the server
        const fetchDownloadFile = async (serverIp, downloadSaveName) => {
            try {
                const response = await fetch(`https://${serverIp}/api/v1`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "function": "DownloadSaveGame", "data": { "SaveName": `${downloadSaveName}` } })
                });

                const data = await response.arrayBuffer();

                // Save the downloaded file to a local directory
                await fsPromise.writeFile(`./fileTransfer/${downloadSaveName}.sav`, Buffer.from(data));
                return data;
            } catch (error) {
                console.error(`Error downloading save file`, error);
                return null;
            }
        };

        // Main execution flow
        const downloadSaveName = await fetchSaveName(serverIp);
        if (!downloadSaveName) {
            await interaction.editReply({
                content: `❌ Failed to fetch save file for **${selectedServer}**.`
            });
            return;
        }

        await interaction.editReply({
            content: `⏳ Fetching and downloading the save file for **${selectedServer}**...`
        });

        const saveFile = await fetchDownloadFile(serverIp, downloadSaveName);

        if (!saveFile) {
            await interaction.editReply({
                content: `❌ Failed to download save file for **${selectedServer}**.`
            });
            return;
        }

        // Reply with the save file and then delete it locally
        try {
            const embed = new EmbedBuilder()
                .setColor(0x00AE86)
                .setTitle('Server Save Download')
                .setDescription(`✅ Successfully fetched save file for **${selectedServer}**.`)
                .addFields(
                    { name: 'Save File', value: `\`${downloadSaveName}\`` }
                )
                .setThumbnail('https://satisfactory.wiki.gg/images/thumb/5/5b/Blueprint_Designer_Mk.2.png/300px-Blueprint_Designer_Mk.2.png') // Thumbnail Image
                .setTimestamp()
                .setFooter({ text: 'Satisfactory Bot', iconURL: 'https://some-footer-icon-url.png' }); // Add footer icon URL

            await interaction.editReply({
                embeds: [embed],
                files: [`./fileTransfer/${downloadSaveName}.sav`]
            });

            // Update the original message to indicate completion
            await interaction.editReply({
                content: `✅ Save file for **${selectedServer}** has been successfully downloaded and sent.`
            });
        } catch (error) {
            console.error('Failed to send file:', error);
            await interaction.editReply({
                content: `❌ Failed to send the save file for **${selectedServer}**.`
            });
        }

        // Clean up the local file
        try {
            fs.unlinkSync(`./fileTransfer/${downloadSaveName}.sav`);
        } catch (err) {
            console.error('File deletion failed:', err);
        }
    }
};
