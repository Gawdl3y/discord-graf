## First steps
The first thing you'll want to do is instantiate the [`Bot`](../class/src/bot/index.js~Bot.html) class, specifying at minimum the properties `name` and `version`.
To add information to the built-in about command, also add the `about` property.
For update checking, specify `updateURL`.  
Example:

```javascript
const graf = require('discord-graf');

const version = '1.0.0';
const bot = new graf.Bot({
	name: 'SomeBot',
	version: version,
	about: `**SomeBot** v${version} created by Some Guy.`,
	updateURL: 'https://raw.githubusercontent.com/SomeGuy/some-bot/master/package.json'
});
```

Then, you'll need to register your modules and commands to the bot, and create the client.  
Example (with command classes):

```javascript
const SomeCommand = require('./commands/general/some-command');
const SomeOtherCommand = require('./commands/general/some-other-command');
const YetAnotherCommand = require('./commands/some-mod/another-command');

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
