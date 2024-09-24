# Satisfactory Discord Bot

The idea of this bot is to make administration as simple as typing a command in discord aswell as giving live* updates on the server status

As the satisfactory API expands so will this bot. Check back after an update for news.

Please post issues in the issue tracker, provide as much info as possible. If you would like to make a fork and modify this bot, it must remain open source and ensure you include a link to this repo and credits 
Pull requests will be reviewed in due course and implemented if they improve the bot and are in keeping with our vision.

# Installation

## Prerequisits

npm
Node.js v20.x (untested on other versions)

## Setup
Clone the Git repo where you want the bot to run, we advise not using a root user to run the bot or putting it in a sensitive location on your system

	git clone https://github.com/BladeRavinger/Satisfactory-Discord-Bot.git

or download and unpack the zip file

With Prerequisites Installed and git cloned, run the discord.js installer:

	npm install discord.js


For now, in early development we are using static .json files to store server information such as IP's and Ports
the servers.json can hold up to 25 servers (discord API limitation) a template exists alongside the app.js

goto https://discord.com/developers/applications and create a bot for your code to work with and invite it to your server
Google can help you with the details, we wont be covering it here.

The bot should only need permission to read and write to chat but should be safe to give admin perms if you so choose.

# Configuration

Configuration
Modify config.json with your discord-bot token and satisfactory-server API token

the satisfactory API token can be grabbed from your satisfactory server, open your game, connect to the admin panel and on the console type

	server.GenerateAPIToken

you may also need your client ID and Guild ID for registering commands (if they are not in the template then we have fixed that)

once all your ID's and tokens are in the right place you can deploy the commands, run this code to do that (we plan to implement a command refresh into bot restarting)

	node deploy-commands.js

# Startup

Running the following command will start the bot up

	node app.js

it will log the bot name that its connected too aswell as a `NODE_TLS_REJECT_UNAUTHORIZED` error.

This error is due too satisfactory using a self-signed certificate, node rejects un-autheticated certificates and crashes. We are investigating options.
If you have your own SSL certificate you can place it with the server and remove the above line from `app.js` before launching your Satisfactory server. (untested)

	`$InstallRoot$/FactoryGame/Certificates/*`

Placing the Certificate and private key in this directory should allow Satisfactory to use it with the API.

# Auto-boot

pm2 can be installed to maintain node.js package on Linux, as that's the env we run on I cannot advise anything else at this time, you got this far, I'm sure you can work something out

again I wont be going into pm2 setup (maybe in a future update) Google is a great resource (and I am lazy)

## Aditional Info

any questions or suggestions, slap them in the issues tab or hit me up on the discord server below.

## Credits

Big thanks to https://github.com/SG1CSIfan for his help with this project, so much so we shared the work load 50/50

This bot is a simplified version of a custom bot we are making for our community over at The Brewery https://discord.gg/Wa9yukZSmd we maintain 10+ Satisfactory servers aswell as many other game servers. All hosted from privately owned hardware that's always evolving and free for everyone to play.
