## Commands
There are two ways to make a command; using the command builder, or making your own class.
Using classes is generally preferred and cleaner.
Regardless of the method used to make your command, you will need an object of command information.
At minimum, the command info must contain the `name`, `module`, `memberName`, and `description` properties.
See the [list of all command options](../typedef/index.html#static-typedef-CommandInfo).
If a command name or alias has hyphens (`-`) in it, the framework will automatically add aliases for de-hyphenated ones.

### Classes
All commands extend the base [`Command`](../class/src/commands/command.js~Command.html) class.
They must all override the [constructor](../class/src/commands/command.js~Command.html#instance-constructor-constructor)
and [`run`](../class/src/commands/command.js~Command.html#instance-method-run) method.
They may also optionally override the [`hasPermission`](../class/src/commands/command.js~Command.html#instance-method-hasPermission) method.

Example command:

```javascript
const graf = require('discord-graf');

module.exports = class AddNumbersCommand extends graf.Command {
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

	run(message, args) {
		if(!args[0]) throw new graf.CommandFormatError(this, message.guild);
		const total = args.reduce((prev, arg) => prev + parseFloat(arg), 0);
		return Promise.resolve(`Sum: ${total}`);
	}
}
```

### Builder
The command builder allows you to make and register commands with the bot with a fluent interface.

To use the builder, just call [`bot.buildCommand()`](../class/src/bot/index.js~Bot.html#instance-method-buildCommand) to get a builder.
Call [`.info()`](../class/src/commands/builder.js~CommandBuilder.html#instance-method-info) on the builder to set the command information before anything else.
Call [`.run()`](../class/src/commands/builder.js~CommandBuilder.html#instance-method-run) to set the command's
[`run`](../class/src/commands/command.js~Command.html#instance-method-run) method.
Optionally call [`.hasPermission()`](../class/src/commands/builder.js~CommandBuilder.html#instance-method-hasPermission) to set the command's
[`hasPermission`](../class/src/commands/command.js~Command.html#instance-method-hasPermission) method.
Note that using arrow functions will not allow you to access the command via `this`, so use regular functions instead.
Finally, call [`.register()`](../class/src/commands/builder.js~CommandBuilder.html#instance-method-register) to register the command to the bot.

Example command:

```javascript
const graf = require('discord-graf');

bot.buildCommand()
	.info({
		name: 'add-numbers',
		aliases: ['add', 'add-nums'],
		module: 'math',
		memberName: 'add',
		description: 'Adds numbers together.',
		usage: 'add-numbers <number> [number2] [number3...]',
		details: 'This is an incredibly useful command that finds the sum of numbers. This command is the envy of all other commands.',
		examples: ['add-numbers 42 1337'],
		argsType: 'multiple'
	})
	.run(function run(message, args) {
		if(!args[0]) throw new graf.CommandFormatError(this, message.guild);
		const total = args.reduce((prev, arg) => prev + parseFloat(arg), 0);
		return Promise.resolve(`Sum: ${total}`);
	})
.register();
```
