const fs = require('fs');
const path = require('path');

// Define the path for the state file inside the utils folder
const stateFilePath = path.join(__dirname, 'richPresenceState.json');

// Load the saved state from the JSON file
function loadState() {
    if (fs.existsSync(stateFilePath)) {
        const stateData = fs.readFileSync(stateFilePath, 'utf-8');
        return JSON.parse(stateData);
    }
    return { enabled: false, server: "" };
}

// Save the state to the JSON file
function saveState(state) {
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
}

module.exports = {
    loadState,
    saveState
};
