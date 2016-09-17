# Discord GRAF
[![Discord](https://discordapp.com/api/guilds/214147099133083659/embed.png)](https://discord.gg/a5ZD9n7)
[![Downloads](https://img.shields.io/npm/dt/discord-graf.svg)](https://www.npmjs.com/package/discord-graf)
[![Version](https://img.shields.io/npm/v/discord-graf.svg)](https://www.npmjs.com/package/discord-graf)
[![Dependency status](https://david-dm.org/Gawdl3y/discord-graf.svg)](https://david-dm.org/Gawdl3y/discord-graf)
[![License](https://img.shields.io/npm/l/discord-graf.svg)](LICENSE)

**GRAF:** Great Rad-Ass Framework

This is a framework for Discord bots to use that makes it stupidly easy to build a bot with Node.js.  
It is written in ES2017 using Babel, and is built on top of [discord.js v9](https://github.com/hydrabolt/discord.js/).

## Features
GRAF contains loads of functionality that any bots built on it can use.
Here's a quick list:
- Command framework (probably the most robust command system of any bot)
	* Plain names and aliases
	* Robust argument parsing (with "quoted strings" support)
	* Regular expression triggers
	* Multiple responses
	* Command editing
- Module system (allows you to disable modules and individual commands per server)
- Admin/moderator permissions (moderators are configurable)
- Channel restrictions (allow the bot to operate only in specific channels in a server)
- Storages to associate arbitrary data with a server
- Configurable command prefix (change the trigger for commands)
- Help system and detailed about command
- Eval command with a system for registering your own objects to make available in its scope, and some utilities
- Lots of utility methods to simplify your logic
- Update checking for your bot
- Stats sending to Carbon and bots.discord.pw

## Documentation
The documentation is a work-in-progress.
You may view it [here](https://gawdl3y.github.io/discord-graf/manual/index.html).  
You may also take a look at other bots' source code to see how they use GRAF.

## Known bots using GRAF
- [RPBot](https://github.com/Gawdl3y/discord-rpbot)
- [Oh Please](https://github.com/datitisev/DiscordBot-OhPlease)
- [Moosik](https://github.com/Gawdl3y/discord-moosik)
