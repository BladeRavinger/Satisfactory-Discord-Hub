const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { servers } = require('../../servers.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('advoptions')
        .setDescription('Get the advanced server options for a specific server')
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
        // Get the selected server from the interaction
        const selectedServer = interaction.options.getString('server');

        // Fetch the server IP from servers.json
        const serverIp = servers[selectedServer].address;
        const apiToken = servers[selectedServer].token;

        // Check if the serverIp is undefined
        if (!serverIp) {
            await interaction.reply(`Server IP for ${selectedServer} not found.`);
            return;
        }

        console.log(`Fetching advanced server options for ${selectedServer} with IP ${serverIp}`);

        // Function to query the server and return the advanced game settings
        const fetchAdvancedGameSettings = async (serverIp) => {
            try {
                const response = await fetch(`https://${serverIp}/api/v1`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "function": "GetAdvancedGameSettings" })
                });

                const data = await response.json();

                if (data.errorCode === 'invalid_token') {
                    console.log(`Token has expired for server: ${serverIp}. Retrying with the same token...`);
                    return null;
                }

                if (!data.data || !data.data.advancedGameSettings) {
                    console.error('Unexpected API response:', data);
                    return null;
                }

                return data.data.advancedGameSettings;

            } catch (error) {
                console.error('Error fetching advanced server options:', error);
                return null;
            }
        };

        // Fetch advanced game settings for the selected server
        const advancedSettings = await fetchAdvancedGameSettings(serverIp);

        if (!advancedSettings) {
            await interaction.reply(`Could not fetch advanced options for ${selectedServer}.`);
            return;
        }

        // Mapping of original option keys to user-friendly names
        const advOptionNameMapping = {
            "FG.GameRules.NoPower": "No Power",
            "FG.GameRules.DisableArachnidCreatures": "Disable Arachnid Creatures",
            "FG.GameRules.NoUnlockCost": "No Unlock Cost",
            "FG.GameRules.SetGamePhase": "Set Game Phase",
            "FG.GameRules.GiveAllTiers": "Give All Tiers",
            "FG.GameRules.UnlockAllResearchSchematics": "Unlock All Research Schematics",
            "FG.GameRules.UnlockInstantAltRecipes": "Unlock Instant Alt Recipes",
            "FG.GameRules.UnlockAllResourceSinkSchematics": "Unlock All Resource Sink Schematics",
            "FG.GameRules.GiveItems": "Give Items",
            "FG.PlayerRules.NoBuildCost": "No Build Cost",
            "FG.PlayerRules.GodMode": "God Mode",
            "FG.PlayerRules.FlightMode": "Flight Mode"
        };

        // Create the settings and values columns
        const settingsColumn = Object.keys(advancedSettings)
            .map(key => advOptionNameMapping[key] || key)
            .join('\n');

        const valuesColumn = Object.keys(advancedSettings)
            .map(key => advancedSettings[key].toString())
            .join('\n');

        // Create the embed with server name and advanced options
        const optionsEmbed = new EmbedBuilder()
            .setTitle(`${selectedServer} - Adv Options`) // Header
            .addFields(
                { name: 'Settings', value: settingsColumn, inline: true }, // Column 1: Settings
                { name: 'Values', value: valuesColumn, inline: true } // Column 2: Values
            )
            .setColor(0x00AE86) // Optional: Set a color for the embed
            .setTimestamp(); // Optional: Adds the current timestamp to the footer

        // Reply with the embed
        await interaction.reply({ embeds: [optionsEmbed] });
    }
};
