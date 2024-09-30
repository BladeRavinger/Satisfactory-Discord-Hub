# Satisfactory Discord Hub
The idea behind this bot is to make server administration as simple as typing a command in Discord, while also providing live* updates on the server status.

As the Satisfactory API evolves, so will this bot. Check back after each update for the latest news.

If you encounter any issues, please report them in the issue tracker, providing as much detail as possible. If you'd like to fork and modify this bot, it must remain open-source. Please ensure you include a link to this repository and proper credits.

Pull requests will be reviewed and implemented if they improve the bot and align with our vision.

# Usage
This bot currently supports the following commands, and the list will grow over time:

# /allserverstatus
Displays the status of all configured servers, showing:
Server Name
Server Status (Online/Offline)
Number of Players vs. Max Players
Current Tier Level (e.g., Tier 5/9)
Average Ticks
Game Duration
The bot will post updates every 2 minutes in the configured channel and will post a new embed whenever it restarts.
Set Channel: You can specify the channel where the updates should be posted.

![All Server Status Embed](https://drive.google.com/uc?export=view&id=19sLsyWcBvgBml26BR9pAVTqBkm6ip0M_)

# /serverstatus
Displays the status of a single server

![server status embed](https://drive.google.com/uc?export=view&id=1ynEMJJGz2zfEWO3mU27kEVu26OTAN41Q)

# /changeoptions
Allows changing in-game settings such as:
Auto Pause
Auto Save
Auto Save Interval
Restart Timer
Gameplay Data

![Change Options Embed](https://drive.google.com/uc?export=view&id=1FybWtFRjjDlBxOOQ2gnBnSWCgauDHp14)

# /serveroptions
Displays the current server options, allowing you to review settings such as difficulty, player limits, and more.

![Server Options Embed](https://drive.google.com/uc?export=view&id=171-56qrpt4tbQr07D96BOJq-a-Kq2n9Q)

# /downloadsave
Saves the game, downloads the current save, and uploads it to Discord. This command allows you to keep a backup of the latest game state and share it easily.

![Server Save Embed](https://drive.google.com/uc?export=view&id=1P7TIZc0rQL69dFznQsn7rU-BOJWoqP8P)

# /advoptions
Displays advanced game options, letting you review and adjust detailed settings for the game.

# /clientpass
Sets a client password directly from Discord, providing an easy way to manage access to your server.

# /restart
Shuts down the selected server. As long as auto-restart is enabled on your server, the bot will handle the shutdown and restart process automatically.

# Command Restrictions:
Most commands are restricted to users with the 'Moderate Member' permission. However, everyone can use the following commands:

Moderators have access to additional commands, such as changing server settings and restarting the server. Along with save download cool down.

# Installation
Prerequisites
Node.js v20.x (untested on other versions)
Setup
Clone the Repository:

bash
Copy code
git clone https://github.com/BladeRavinger/Satisfactory-Discord-Bot.git
Install Dependencies: Move into the directory where you cloned the repo, and install the necessary dependencies:

bash
Copy code
npm install
(Optional) Install pm2: To keep the bot running even after server restarts or crashes, you can install pm2 globally:

bash
Copy code
npm install pm2@latest -g
Configuration:

Copy the environment template and fill out the necessary fields:

bash
Copy code
cp .env.example .env
You can get the Satisfactory API token from your server's admin panel by using the command:

bash
Copy code
server.GenerateAPIToken
You can find the Discord bot token and appId on the Discord Developer Portal: https://discord.com/developers/applications.
If you have an SSL certificate, you can place it in the following directory:
ruby
Copy code
$InstallRoot$/FactoryGame/Certificates/*
Server Configuration:

Make a copy of servers.json.example and fill it with your server's details (Name, IP
, and API Token):
bash
Copy code
cp servers.json.example servers.json
Launching
There are multiple ways to start the bot. We've included some scripts to help with this:

# Basic Startup:

bash
Copy code
npm run start
Note: If you run this in a terminal, the bot will stop once the shell closes.

# With pm2:

bash
Copy code
npm run pm2:start
npm run pm2:stop
The pm2 script automatically restarts the bot at midnight and watches specific folders. If you pull updates, the bot will automatically restart to apply changes.
To have pm2 restart your bot whenever the system restarts, run:

bash
Copy code
pm2 startup
pm2 save
Additional Info
For any questions or suggestions, feel free to open an issue on GitHub or reach out on Discord: Join our Discord server.

# Credits
Big thanks to SG1CSIfan for his invaluable help on this project. This bot is a simplified version of a custom bot we're building for our community over at The Brewery. We maintain 10+ Satisfactory servers, among others, all hosted on privately-owned hardware and free for everyone to use.
