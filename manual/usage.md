## Setup
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

- [List of command settings](../typedef/index.html#static-typedef-CommandInfo)

Example command:

```javascript
import { Command, CommandFormatError } from 'discord-graf';

export default class AddNumbersCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'addnumbers',
			aliases: ['add', 'addnums'],
			module: 'math',
			memberName: 'add',
			description: 'Adds numbers together.',
			usage: 'addnumber <number> [number2] [number3...]',
			details: 'This is an incredibly useful command that finds the sum of numbers. This command is the envy of all other commands.',
			examples: ['addnumber 42 1337'],
			argsType: 'multiple'
		});
	}

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.server);
		const total = args.reduce((prev, arg) => prev + parseFloat(arg), 0);
		return `Sum: ${total}`;
	}
}
```

## Permissions
Documentation coming soon&trade;.

## Storage
Documentation coming soon&trade;.
