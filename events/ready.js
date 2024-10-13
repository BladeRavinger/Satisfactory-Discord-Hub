const { REST, Routes, Events } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { statusHandler } = require('./statusEvents');
const { richPresenceHandler } = require('./richPresenceHandler');
const { loadState } = require('../utils/richPresenceUtils'); // Load the state from utils

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);

        const commands = [];
        const foldersPath = path.join(__dirname, '../commands');
        const commandFolders = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        }

        const { appId, discordToken, statusChannelId } = process.env;

        if (!appId || !discordToken) {
            console.error('Error: Missing essential environment variables (appId or discordToken)');
            return;
        }

        const rest = new REST().setToken(discordToken);

        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);
            const data = await rest.put(
                Routes.applicationCommands(appId),
                { body: commands },
            );
            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
            console.error('Error registering commands:', error);
        }

        try {
            console.log(`Bot started, posting server status in channel ${statusChannelId}`);
            await statusHandler(client);
        } catch (error) {
            console.error(`Failed to send server status on bot startup: ${error}`);
        }

        // Load the saved state and activate rich presence if enabled
        const savedState = loadState();
        if (savedState.enabled) {
            console.log(`Resuming rich presence for server: ${savedState.server}`);
            await richPresenceHandler(client, savedState.server);
        }
    },
};
