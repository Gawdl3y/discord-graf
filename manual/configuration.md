## Information
There are two main ways to configure GRAF at runtime; by passing an object with all configuration to the Bot constructor, or by using Yargs.

You can, of course, modify configuration at any time after constructing the bot.
However, you should be careful about accessing the bot's logger before configuring the log settings, as the logger will not be updated to reflect the new config values.
The registry will also access the bot's logger.

- [List of all possible config values](../typedef/index.html#static-typedef-ConfigObject)
- [Config object](../class/src/bot/config.js~BotConfig.html)

## Constructor
Simply pass all configuration to the Bot constructor.  
Example:
```javascript
import { Bot } from 'discord-graf';

const version = '1.0.0';
const bot = new Bot({
	botName: 'SomeBot',
	botVersion: version,
	token: 'SomeLongTokenStringForABotAccount',
	email: 'SomeEmail@ForAUserAccount.com',
	password: 'SomePasswordForAUserAccount',
	clientOptions: {
		disableEveryone: true
	}
});
```

## Yargs
Using yargs allows you to configure your bot from the command line, rather than hard-coding account credentials and other things.
To learn more about yargs, check out [its documentation](http://yargs.js.org/).

When adding your own options to yargs, first load it into GRAF's config with `bot.config.yargs(yargs)`.
This will add a bunch of options for GRAF's configuration, and automatically load their values into the bot's config.  
Example:
```javascript
import { Bot } from 'discord-graf';
import yargs from 'yargs';

const version = '1.0.0';
const bot = new Bot({
	botName: 'SomeBot',
	botVersion: version
});

const config = bot.config.yargs(yargs)
	.option('some-option', {
		type: 'string',
		describe: 'Just some option.',
		group: 'General:'
	})
	.help()
	.alias('help', 'h')
	.group('help', 'Special:')
	.version(version)
	.alias('version', 'v')
	.group('version', 'Special:')
	.completion('completion')
	.wrap(yargs.terminalWidth())
.argv;

bot.logger.debug('My config', config);
bot.logger.debug('Bot config', bot.config.values);
```

You may also modify the defaults for the built-in options before loading yargs, like so:
```javascript
bot.config.defaults.log = 'somebot.log';
bot.config.defaults.storage = 'somebot-storage';
bot.config.loadDefaults();

const config = bot.config.yargs(yargs)
...
```
