## Information
Even though the framework is written with them, you don't need to write your code with ES6 modules and ES2017 async/await.
Imports and exports are replaceable by the CommonJS `require` function and `exports` object.
Any `async` functions return `Promise`s.

The framework is built on top of the [discord.js rewrite](http://hydrabolt.github.io/discord.js/index.html#!/docs).
A Discord server is always referred to as a `Guild` internally, as that's what the API calls them.

## First steps
The first thing you'll want to do is instantiate the [`Bot`](../class/src/bot/index.js~Bot.html) class, specifying at minimum the properties `name` and `version`.
To add information to the built-in about command, also add the `about` property.
For update checking, specify `updateURL`.  
Example:

```javascript
import { Bot, Command } from 'discord-graf';

const version = '1.0.0';
const bot = new Bot({
	name: 'SomeBot',
	version: version,
	about: `**SomeBot** v${version} created by Some Guy.`,
	updateURL: 'https://raw.githubusercontent.com/SomeGuy/some-bot/master/package.json'
});
```

Then, you'll need to register your modules and commands to the bot, and create the client.  
Example:

```javascript
import SomeCommand from './commands/general/some-command';
import SomeOtherCommand from './commands/general/some-other-command';
import YetAnotherCommand from './commands/some-mod/another-command';

const client = bot
	.registerDefaults()
	.registerModules([
		['general', 'General'],
		['something', 'Some module']
	])
	.registerCommands([
		SomeCommand,
		SomeOtherCommand,
		YetAnotherCommand
	])
.createClient();
```

That's it!
You now have a fully-functioning bot.

## Commands
All commands extend the base [`Command`](../class/src/commands/command.js~Command.html) class.
They must all override the [constructor](../class/src/commands/command.js~Command.html#instance-constructor-constructor)
and [`run`](../class/src/commands/command.js~Command.html#instance-method-run) method.
They may also optionally override the [`hasPermission`](../class/src/commands/command.js~Command.html#instance-method-hasPermission) method.
If a command name or alias has hyphens (`-`) in it, the framework will automatically add aliases for de-hyphenated ones.

- [List of command settings](../typedef/index.html#static-typedef-CommandInfo)

Example command:

```javascript
import { Command, CommandFormatError } from 'discord-graf';

export default class AddNumbersCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'add-numbers',
			aliases: ['add', 'add-nums'],
			module: 'math',
			memberName: 'add',
			description: 'Adds numbers together.',
			usage: 'add-numbers <number> [number2] [number3...]',
			details: 'This is an incredibly useful command that finds the sum of numbers. This command is the envy of all other commands.',
			examples: ['add-numbers 42 1337'],
			argsType: 'multiple'
		});
	}

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.guild);
		const total = args.reduce((prev, arg) => prev + parseFloat(arg), 0);
		return `Sum: ${total}`;
	}
}
```

## Permissions
Every bot has an instance of [`BotPermissions`](../class/src/bot/permissions.js~BotPermissions.html) as `bot.permissions` that contains handy methods for checking the permissions of a user on a server.
There are three permissions:
- Owner ([`isOwner`](../class/src/bot/permissions.js~BotPermissions.html#instance-method-isOwner)):
  Only the owner of the bot has this permission, and they have it in every server.
- Administrator ([`isAdmin`](../class/src/bot/permissions.js~BotPermissions.html#instance-method-isAdmin)):
  A user has this permission if they are the bot owner, or if they have a role on the server with the "Administrate" permission.
- Moderator ([`isMod`](../class/src/bot/permissions.js~BotPermissions.html#instance-method-isMod)):
  A user has this permission if they are the bot owner, they are an admin, or they have one of the moderator roles assigned.
  If there are no moderator roles set in the server, then the "Manage messages" permission on any of their roles will make them a moderator instead.

## Guild storage
The [`GuildStorage`](../class/src/storage/index.js~GuildStorage.html) class allows you to create storages that associate data with guilds.
You can either directly instantiate the base `GuildStorage` class, or extend it.
There are three built-in storages that every bot has an instance of:
- [`AllowedChannelStorage`](../class/src/storage/allowed-channels.js~AllowedChannelStorage.html) as `bot.storage.allowedChannels`
- [`ModRoleStorage`](../class/src/storage/mod-roles.js~ModRoleStorage.html) as `bot.storage.modRoles`
- [`SettingStorage`](../class/src/storage/settings.js~SettingStorage.html) as `bot.storage.settings`

You probably will never need to use the first two, as they are used primarily by built-in commands/functionality.
The `SettingStorage`, however, could prove to be very useful for your bot.
It's essentially a key-value store that is associated with guilds, so you can store simple per-guild settings with it.

It is not recommended to use the storages to store large amounts of data or user-generated content.
Use [SQLite](https://www.npmjs.com/package/sqlite) or some other database for that.

## Utilities
Every bot has an instance of [`BotUtil`](../class/src/bot/util.js~BotUtil.html) as `bot.util`.
This contains several handy methods:
- [`usage`](../class/src/bot/util.js~BotUtil.html#instance-method-usage) creates command usage strings to send in messages
- [`nbsp`](../class/src/bot/util.js~BotUtil.html#instance-method-nbsp) converts all spaces in a string into non-breaking spaces
- [`disambiguation`](../class/src/bot/util.js~BotUtil.html#instance-method-disambiguation) creates disambiguation strings to send in messages
  (for when you find multiple matches from user input, and need a specific one)
- [`paginate`](../class/src/bot/util.js~BotUtil.html#instance-method-paginate) paginates an array of items, and returns info about the pagination
- [`search`](../class/src/bot/util.js~BotUtil.html#instance-method-search) searches an array of items and finds matches
- [`split`](../class/src/bot/util.js~BotUtil.html#instance-method-split) splits a string into multiple strings that will fit within Discord's 2,000 character limit
