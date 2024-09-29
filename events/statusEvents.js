const { servers } = require('../servers.json');
const statusCommand = require('../commands/satisfactory/status');

// This flag will track whether the error has been logged
let errorLogged = false;

async function statusHandler(client) {
    // Check if the error has been logged before
    if (errorLogged) {
        return; // Stop execution if the error has already been logged
    }

    try {
        const channel = await client.channels.fetch(process.env.statusChannelId);
        if (!channel) {
            console.error(`Channel with ID ${process.env.statusChannelId} not found.`);
            errorLogged = true; // Set the flag to prevent future attempts
            return;
        }

        // Mock interaction for the status command
        const interactionMock = {
            channel,
            editReply: async ({ embeds }) => {
                return await channel.send({ embeds });
            },
            deferReply: async () => { },
        };

        await statusCommand.execute(interactionMock);
        console.log("Server status embed posted successfully.");

    } catch (error) {
        if (!errorLogged) {
            console.error(`Error posting server status: ${error}`);
            errorLogged = true; // Set the flag to prevent the error from repeating
        }
    }
}

module.exports = { statusHandler };
