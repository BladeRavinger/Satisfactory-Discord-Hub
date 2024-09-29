const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { servers } = require('../../servers.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serveroptions')
        .setDescription('Get the current server options for a specific server')
        .addStringOption(option =>
            option.setName('server')
                .setDescription('Select a server to query')
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
        // Defer the reply immediately to prevent the interaction from timing out
        await interaction.deferReply();

        // Get the selected server from the interaction
        const selectedServer = interaction.options.getString('server');

        // Fetch the server IP from servers.json
        const serverIp = servers[selectedServer].address;
        const apiToken = servers[selectedServer].token;

        // Check if the serverIp is undefined
        if (!serverIp) {
            await interaction.editReply(`Server IP for ${selectedServer} not found.`);
            return;
        }

        console.log(`Fetching server options for ${selectedServer} with IP ${serverIp}`);

        // Function to query the server and return the server options
        const fetchServerOptions = async (serverIp) => {
            try {
                const response = await fetch(`https://${serverIp}/api/v1`, {
                    method: 'POST',
                    headers: {
                        Authorization: 'Bearer ' + apiToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "function": "GetServerOptions" })
                });

                const data = await response.json();

                if (data.errorCode === 'invalid_token') {
                    console.log(`Token has expired for server: ${serverIp}. Retrying with the same token...`);
                    return null;
                }

                if (!data.data || !data.data.serverOptions) {
                    console.error('Unexpected API response:', data);
                    return null;
                }

                return data.data.serverOptions;

            } catch (error) {
                console.error('Error fetching server options:', error);
                return null;
            }
        };

        // Fetch options for the selected server
        const options = await fetchServerOptions(serverIp);

        if (!options) {
            await interaction.editReply(`Could not fetch options for ${selectedServer}.`);
            return;
        }

        // Mapping of original option keys to user-friendly names
        const optionNameMapping = {
            "FG.DSAutoPause": "Auto Pause",
            "FG.DSAutoSaveOnDisconnect": "Auto Save On Disconnect",
            "FG.AutosaveInterval": "Autosave Interval",
            "FG.ServerRestartTimeSlot": "Server Restart Time Slot",
            "FG.SendGameplayData": "Send Gameplay Data",
            "FG.NetworkQuality": "Network Quality"
        };

        // Function to format time
        const formatTime = (totalMinutes) => {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return `${hours}h ${minutes}m`;
        };

        // Format the options for output in the embed
        const settings = [];
        const values = [];

        Object.keys(options).forEach(key => {
            let value = options[key];

            // Convert seconds to minutes for FG.AutosaveInterval
            if (key === "FG.AutosaveInterval") {
                value = `${value / 60} minutes`;  // Convert seconds to minutes
            }

            // Convert minutes to hours and minutes for FG.ServerRestartTimeSlot
            if (key === "FG.ServerRestartTimeSlot") {
                value = formatTime(value);  // Convert minutes to hours and minutes
            }

            settings.push(optionNameMapping[key] || key);
            values.push(value.toString());
        });

        // Create the embed with server options
        const embed = new EmbedBuilder()
            .setTitle(`${selectedServer} - Current Options`)
            .addFields(
                { name: 'Setting', value: settings.join('\n'), inline: true },
                { name: 'Value', value: values.join('\n'), inline: true }
            )
            .setColor(0x00AE86)
            .setTimestamp();

        // Send the embed as a reply
        await interaction.editReply({ embeds: [embed] });
    }
};
