'use babel';
'use strict';

export const values = {};
export default values;

export const defaults = {
	playingGame: 'Message for help',
	paginationItems: 10,
	autoReconnect: true,
	storage: 'bot-storage',
	updateCheck: 60,
	commandPrefix: '!',
	commandEditable: 30,
	nonCommandEdit: true,
	log: 'bot.log',
	logMaxSize: 5242880,
	logMaxFiles: 5,
	logLevel: 'info',
	consoleLevel: 'info'
};

export function setValues(configObj) {
	Object.assign(values, defaults, values, configObj);
}

export function loadYargs(yargs) {
	Object.assign(values, yargs
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
			default: defaults.playingGame,
			alias: 'g',
			describe: 'Text to show in the "Playing..." status',
			group: 'General:'
		})
		.option('pagination-items', {
			type: 'number',
			default: defaults.paginationItems,
			alias: 'I',
			describe: 'Number of items per page in paginated commands',
			group: 'General:'
		})
		.option('auto-reconnect', {
			type: 'boolean',
			default: defaults.autoReconnect,
			alias: 'a',
			describe: 'Whether or not the bot should automatically reconnect when disconnected',
			group: 'General:'
		})
		.option('storage', {
			type: 'string',
			default: defaults.storage,
			alias: 's',
			describe: 'Path to storage directory',
			group: 'General:',
			normalize: true
		})
		.option('update-check', {
			type: 'number',
			default: defaults.updateCheck,
			alias: 'U',
			describe: 'How frequently to check for an update (in minutes, use 0 to disable)',
			group: 'General:'
		})

		// Commands
		.option('command-prefix', {
			type: 'string',
			default: defaults.commandPrefix,
			alias: 'P',
			describe: 'Default command prefix (blank to use only mentions)',
			group: 'Commands:'
		})
		.option('command-editable', {
			type: 'number',
			default: defaults.commandEditable,
			alias: 'E',
			describe: 'How long a command message is editable (in seconds, use 0 to disable)',
			group: 'Commands:'
		})
		.option('non-command-edit', {
			type: 'boolean',
			default: defaults.nonCommandEdit,
			alias: 'N',
			describe: 'Whether or not a non-command message can be edited into a command',
			group: 'Commands:'
		})

		// Logging
		.option('log', {
			type: 'string',
			default: defaults.log,
			alias: 'l',
			describe: 'Path to log file',
			group: 'Logging:',
			normalize: true
		})
		.option('log-max-size', {
			type: 'number',
			default: defaults.logMaxSize,
			defaultDescription: '5MB',
			alias: 'S',
			describe: 'Maximum size of single log file (in bytes)',
			group: 'Logging:'
		})
		.option('log-max-files', {
			type: 'number',
			default: defaults.logMaxFiles,
			alias: 'F',
			describe: 'Maximum amount of log files to keep',
			group: 'Logging:'
		})
		.option('log-level', {
			type: 'string',
			default: defaults.logLevel,
			alias: 'L',
			describe: 'Log level to output to the log file (error, warn, info, verbose, debug)',
			group: 'Logging:'
		})
		.option('console-level', {
			type: 'string',
			default: defaults.consoleLevel,
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
