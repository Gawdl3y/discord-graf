'use babel';
'use strict';

export default {


	yargs(yargs) {
		Object.assign(this, yargs
			// Authentication
			.option('token', {
				type: 'string',
				alias: 't',
				describe: 'API token for the bot account',
				group: 'Authentication:'
			})
			.option('email', {
				type: 'string',
				alias: 'e',
				describe: 'Email of the Discord account for the bot to use',
				group: 'Authentication:'
			})
			.option('password', {
				type: 'string',
				alias: 'p',
				describe: 'Password of the Discord account for the bot to use',
				group: 'Authentication:'
			})
			.implies({ email: 'password', password: 'email' })

			// General
			.option('owner', {
				type: 'string',
				alias: 'o',
				describe: 'Discord user ID of the bot owner',
				group: 'General:'
			})
			.option('invite', {
				type: 'string',
				alias: 'i',
				describe: 'Discord instant invite to a server to contact the owner',
				group: 'General:'
			})
			.option('playing-game', {
				type: 'string',
				default: 'Message for help',
				alias: 'g',
				describe: 'Text to show in the "Playing..." status',
				group: 'General:'
			})
			.option('pagination-items', {
				type: 'number',
				default: 10,
				alias: 'I',
				describe: 'Number of items per page in paginated commands',
				group: 'General:'
			})
			.option('auto-reconnect', {
				type: 'boolean',
				default: true,
				alias: 'a',
				describe: 'Whether or not the bot should automatically reconnect when disconnected',
				group: 'General:'
			})
			.option('storage', {
				type: 'string',
				default: 'bot-storage',
				alias: 's',
				describe: 'Path to storage directory',
				group: 'General:',
				normalize: true
			})
			.option('update-check', {
				type: 'number',
				default: 60,
				alias: 'U',
				describe: 'How frequently to check for an update (in minutes, use 0 to disable)',
				group: 'General:'
			})

			// Commands
			.option('command-prefix', {
				type: 'string',
				default: '!',
				alias: 'P',
				describe: 'Default command prefix (blank to use only mentions)',
				group: 'Commands:'
			})
			.option('command-editable', {
				type: 'number',
				default: 30,
				alias: 'E',
				describe: 'How long a command message is editable (in seconds, use 0 to disable)',
				group: 'Commands:'
			})
			.option('non-command-edit', {
				type: 'boolean',
				default: true,
				alias: 'N',
				describe: 'Whether or not a non-command message can be edited into a command',
				group: 'Commands:'
			})

			// Logging
			.option('log', {
				type: 'string',
				default: 'bot.log',
				alias: 'l',
				describe: 'Path to log file',
				group: 'Logging:',
				normalize: true
			})
			.option('log-max-size', {
				type: 'number',
				default: 5242880,
				defaultDescription: '5MB',
				alias: 'S',
				describe: 'Maximum size of single log file (in bytes)',
				group: 'Logging:'
			})
			.option('log-max-files', {
				type: 'number',
				default: 5,
				alias: 'F',
				describe: 'Maximum amount of log files to keep',
				group: 'Logging:'
			})
			.option('log-level', {
				type: 'string',
				default: 'info',
				alias: 'L',
				describe: 'Log level to output to the log file (error, warn, info, verbose, debug)',
				group: 'Logging:'
			})
			.option('console-level', {
				type: 'string',
				default: 'info',
				alias: 'C',
				describe: 'Log level to output to the console (error, warn, info, verbose, debug)',
				group: 'Logging:'
			})
			.option('config', {
				type: 'string',
				alias: 'c',
				describe: 'Path to JSON/YAML config file',
				group: 'Special:',
				normalize: true,
				config: true,
				configParser: configFile => {
					const extension = require('path').extname(configFile).toLowerCase();
					if(extension === '.json') {
						return JSON.parse(require('fs').readFileSync(configFile));
					} else if(extension === '.yml' || extension === '.yaml') {
						return require('js-yaml').safeLoad(require('fs').readFileSync(configFile));
					}
					throw new Error('Unknown config file type.');
				}
			})
		.argv);
		return yargs;
	}
};
