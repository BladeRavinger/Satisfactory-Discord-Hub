# Satisfactory Discord Bot

The idea of this bot is to make administration as simple as typing a command in discord as well as giving live* updates on the server status

As the satisfactory API expands, so will this bot. Check back after an update for news.

Please post issues in the issue tracker, provide as much info as possible. If you would like to make a fork and modify this bot, it must remain open source and ensure you include a link to this repo and credits 
Pull requests will be reviewed in due course and implemented if they improve the bot and are in keeping with our vision.

# Installation

## Prerequisites

Node.js v20.x (untested on other versions)

## Setup
Clone the Git repo where you want the bot to run, we advise not using a root user to run the bot or putting it in a sensitive location on your system

	git clone https://github.com/BladeRavinger/Satisfactory-Discord-Bot.git

Node Package Manager (NPM) will install the minimum dependencies, move into the directory of the git clone and run

	npm install 

Optionally you can install pm2, this package will keep the bot running if you restart your server or an error occurs and it crashes

	npm install pm2@latest -g

The `-g` above installs pm2 globally, allowing you to take full advantage of it

# Configuration

Make a copy of the environment file we use to store tokens for the bot

	cp .env.example .env

Then go ahead and fill out the fields within

The satisfactory API token can be grabbed from your satisfactory server, open your game, connect to the admin panel and on the console type

	server.GenerateAPIToken

The discord token can appId can both be found on your bots' developer panel at https://discord.com/developers/applications

If you haven't yet created a Bot application with discord now is the time, I won't be covering how to do that here, but Google has some resources that can help


The bot should only need permission to read and write to chat, but should be safe to give admin perms if you so choose.(this maybe updated as we develop the bot)

If you have your own SSL certificate, you can place it with the server (Optional, not at all required)

	`$InstallRoot$/FactoryGame/Certificates/*`

Placing the Certificate and private key in this directory should allow Satisfactory to use it with the API.

# Launching

There are a few ways to start the bot, we have included some scripts to save you working it out yourself

	npm run start

Will run the most basic startup script, if you are connected via terminal once the shell closes so will your bot so we don't recommend this

If you would like to run with pm2, then you can use

	npm run pm2:start
	npm run pm2:stop

To start and stop the bot, the start command here is preloaded to auto restart the bot every midnight and also watch certain folders so in the event you pull a new update
The bot should restart automatically on file updates, making maintenance friendlier for you.

If you intend for pm2 to restart your bot every time the system restarts, then don't forget to run 

	pm2 startup

And read its output, sometimes it will make recommendations if it was unable to set up the config

	pm2 save

Will lock in the currently running pm2 processes to its auto start environment

## Additional Info

any questions or suggestions, slap them in the issues tab or hit me up on the discord server below.

## Credits

Big thanks to https://github.com/SG1CSIfan for his help with this project, so much so we shared the work load 50/50

This bot is a simplified version of a custom bot we are making for our community over at The Brewery https://discord.gg/Wa9yukZSmd we maintain 10+ Satisfactory servers as well as many other game servers. 
All hosted from privately owned hardware that's always evolving and free for everyone to play.
