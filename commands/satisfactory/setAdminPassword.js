const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { servers } = require('../../servers.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adminpass')
        .setDescription('Change Admin Password for a specific server')
        .addStringOption(option =>
            option.setName('server')
                .setDescription('Select a server to change password')
                .setRequired(true)
                .addChoices(
                    Object.entries(servers).slice(0, 25).map(([serverName, serverIp]) => ({
                        name: serverName,
                        value: serverName
                    }))
                )
        )
        .addStringOption(option =>
            option.setName('password')
                .setDescription('Enter Desired Password')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('newtoken')
                .setDescription('Include the server token if the bot has never connected to this server before')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    async execute(interaction, apiToken) {
        const selectedServer = interaction.options.getString('server');
        const serverIp = servers[selectedServer];
        if (interaction.options.getString('newtoken') != null) {
            apiToken = interaction.options.getString('newtoken')
        }
        const password = interaction.options.getString('password');

        if (!serverIp) {
            await interaction.reply(`Server IP for ${selectedServer} not found.`);
            return;
        }

        // Defer reply early to prevent timeout issues
        await interaction.deferReply({ ephemeral: true });

        try {
            const response = await fetch(`https://${serverIp}/api/v1`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "function": "SetAdminPassword", "data": { "Password": `${password}`, "AuthenticationToken": `${apiToken}` } })
            });

            const data = await response.json();

            if (response.status != 200 || response.status != 204) {
                error = {
                    "status-code": response.status,
                    "response": data
                }

                throw error
            }
            console.log(response);

            await interaction.editReply({ content: `Admin Password Updated to ||${password}||` });

        } catch (error) {
            console.error('Error updating password:', error);
            if (response.status == 401) {
                await interaction.editReply({ content: "Error updating password: Auth failure, Wrong APIToken"  });
            }
            await interaction.editReply({ content: "Error updating password: Read Logs" });
            return null;
        }
    }
}
