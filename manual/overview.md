## Information
**GRAF:** Great Rad-Ass Framework

This is a framework for Discord bots to use that makes it stupidly easy to build a bot with Node.js.  
It is written in ES2017 using Babel, and is built on top of [discord.js](https://github.com/hydrabolt/discord.js).

## Features
GRAF contains loads of functionality that any bots built on it can use.
Here's a quick list:
- Command framework (with plain names, aliases, argument parsing, and optional regex patterns - probably the most robust command system of any bot)
- Module system (allows you to disable modules and individual commands per server)
- Admin/moderator permissions (moderators are configurable)
- Channel restrictions (allow the bot to operate only in specific channels in a server)
- Configurable command prefix (change the trigger for commands)
- Help system and detailed about command
- Eval command with a system for registering your own objects to make available in its scope, and some utilities
- Lots of utility methods to simplify your logic
- Update checking for your bot

## Commands
GRAF allows bots to accept commands in multiple formats.
You may use a command by prefixing it with the command prefix (default `!`) or the bot's mention (e.g. `@SomeBot#1337`).
Use `!help` or `@SomeBot#1337 help`, for example.
The prefix is configurable on a server-by-server basis, with the `prefix` command.
The bot will also handle commands in DMs.

See the [usage documentation](./usage.html#permissions) for information about permissions.

### Information
| Command          | Permission required | Description                                                                                         |
|------------------|---------------------|-----------------------------------------------------------------------------------------------------|
| help             |                     | Displays a list of available commands, or detailed information for a specified command.             |
| about            |                     | Displays information about the bot.                                                                 |

### Modules
| Command          | Permission required | Description                                                                                         |
|------------------|---------------------|-----------------------------------------------------------------------------------------------------|
| modules          | Administrator       | Lists all modules.                                                                                  |
| togglemodule     | Administrator       | Toggles a module or command.                                                                        |
| enablemodule     | Administrator       | Enables a module or command.                                                                        |
| disablemodule    | Administrator       | Disables a module or command.                                                                       |

### Moderator roles
| Command          | Permission required | Description                                                                                         |
|------------------|---------------------|-----------------------------------------------------------------------------------------------------|
| modroles         | Administrator       | Lists all moderator roles.                                                                          |
| addmodrole       | Administrator       | Adds a moderator role.                                                                              |
| deletemodrole    | Administrator       | Deletes a moderator role.                                                                           |
| clearmodroles    | Administrator       | Clears all of the moderator roles.                                                                  |

### Channels
| Command              | Permission required | Description                                                                                     |
|----------------------|---------------------|-------------------------------------------------------------------------------------------------|
| allowedchannels      |                     | Lists all channels command operation is allowed in.                                             |
| allowchannel         | Administrator       | Allows command operation in a channel.                                                          |
| disallowchannel      | Administrator       | Disallows command operation in a channel.                                                       |
| clearallowedchannels | Administrator       | Clears all of the allowed channels.                                                             |

### Utility
| Command          | Permission required | Description                                                                                         |
|------------------|---------------------|-----------------------------------------------------------------------------------------------------|
| prefix           |                     | Shows or sets the command prefix.                                                                   |
| eval             | Owner               | Evaluates input as JavaScript.                                                                      |
