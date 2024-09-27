const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { servers } = require('../../servers.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clientpass')
        .setDescription('Change Player Password for a specific server')
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
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    async execute(interaction) {
        const selectedServer = interaction.options.getString('server');
        // Fetch the server IP from servers.json
        const serverIp = servers[selectedServer].address;
        const apiToken = servers[selectedServer].token;
        var password = interaction.options.getString('password');
        if (password == null) {
            password = ""
        }

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
                body: JSON.stringify({ "function": "SetClientPassword", "data": { "Password": `${password}` } })
            });

            console.log(response);

            await interaction.editReply({ content: `Player Password Updated` });

        } catch (error) {
            console.error('Error fetching server options:', error);
            await interaction.editReply({ contect: "Error fetching server options: Read Logs" });
            return null;
        }
    }
}
