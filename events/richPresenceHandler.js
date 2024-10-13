const { servers } = require('../servers.json');
let richPresenceInterval = null;

const richPresenceHandler = async (client, selectedServer) => {
    console.log(`Starting rich presence for server: ${selectedServer}`);

    const updatePresence = async () => {
        const serverIp = servers[selectedServer].address;
        const apiToken = servers[selectedServer].token;

        console.log(`Fetching player count from server: ${serverIp}`);

        try {
            const response = await fetch(`https://${serverIp}/api/v1`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ "function": "QueryServerState" }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch player data: ${response.statusText}`);
            }

            const data = await response.json();
            const playerCount = data.data.serverGameState.numConnectedPlayers || 0;
            const maxPlayers = data.data.serverGameState.playerLimit || 0;

            console.log(`Fetched player count: ${playerCount}/${maxPlayers}`);

            // Update the bot's rich presence
            client.user.setActivity(`Online: ${playerCount}/${maxPlayers}`, { type: 'PLAYING' });
            console.log(`Updated rich presence: ${playerCount}/${maxPlayers} players online`);

        } catch (error) {
            console.error('Error fetching player count:', error);
        }
    };

    // Clear any existing interval to avoid conflicts
    if (richPresenceInterval) {
        clearInterval(richPresenceInterval);
    }

    // Set interval for updating presence every 30 seconds
    richPresenceInterval = setInterval(updatePresence, 30000);

    // Initial presence update
    await updatePresence();
};

module.exports = { richPresenceHandler };
