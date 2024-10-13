const fs = require('fs');
const path = require('path');

// Path to your state file (which will store temporary values like rich presence status)
const stateFilePath = path.join(__dirname, 'richPresenceState.json');

// Function to get the state
const getState = () => {
    try {
        if (fs.existsSync(stateFilePath)) {
            const data = fs.readFileSync(stateFilePath);
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Error reading state file:", error);
    }
    return { richPresenceEnabled: false, richPresenceServer: '' }; // Default values
};

// Function to update the state
const updateState = (newState) => {
    try {
        const currentState = getState();
        const updatedState = { ...currentState, ...newState };
        fs.writeFileSync(stateFilePath, JSON.stringify(updatedState, null, 2));
    } catch (error) {
        console.error("Error updating state file:", error);
    }
};

module.exports = { getState, updateState };
