const { servers } = require('../servers.json');
const statusCommand = require('../commands/satisfactory/status');

async function statusHandler(client) {
    const channel = await client.channels.fetch(process.env.statusChannelId);
    if (!channel) {
        console.error(`Channel with ID ${process.env.statusChannelId} not found.`);
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

    try {
        await statusCommand.execute(interactionMock);
        console.log("Server status embed posted successfully.");
    } catch (error) {
        console.error(`Error posting server status: ${error}`);
    }
}

module.exports = { statusHandler };
