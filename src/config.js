'use babel';
'use strict';

/**
 * Configuration object for a bot
 */
export default class BotConfig {
	/**
	 * @param {ConfigObject} [values] - The configuration to start with
	 * @param {ConfigObject} [defaults] - The defaults to start with
	 */
	constructor(values, defaults) {
		this._values = {};

		/**
		 * @type {ConfigObject}
		 */
		this.defaults = Object.assign({}, defaultDefaults, defaults);
		this.loadDefaults();

		this.values = values;
	}

	/**
	 * Adds to the current values, overwriting existing ones
	 * @param {ConfigObject} values - The values to add
	 */
	set values(values) {
		Object.assign(this._values, values);
	}

	/**
	 * Gets the current values
	 */
	get values() {
		return this._values;
	}

	/**
	 * Adds the defaults to the current values
	 * @param {boolean} overwrite - Whether or not the defaults should overwrite existing values
	 * @return {void}
	 */
	loadDefaults(overwrite = false) {
		if(overwrite) {
			Object.assign(this._values, this.defaults);
		} else {
			for(const key of Object.keys(this.defaults)) {
				if(!(key in this._values)) this._values[key] = this.defaults[key];
			}
		}
	}

	/**
	 * Loads configuration from yargs, adding a bunch of default bot options
	 * @param {Yargs} yargs - The yargs instance to use
	 * @return {Yargs} The yargs instance
	 */
	yargs(yargs) {
		this.values = yargs
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
				default: this.defaults.playingGame,
				alias: 'g',
				describe: 'Text to show in the "Playing..." status',
				group: 'General:'
			})
			.option('pagination-items', {
				type: 'number',
				default: this.defaults.paginationItems,
				alias: 'I',
				describe: 'Number of items per page in paginated commands',
				group: 'General:'
			})
			.option('auto-reconnect', {
				type: 'boolean',
				default: this.defaults.autoReconnect,
				alias: 'a',
				describe: 'Whether or not the bot should automatically reconnect when disconnected',
				group: 'General:'
			})
			.option('storage', {
				type: 'string',
				default: this.defaults.storage,
				alias: 's',
				describe: 'Path to storage directory',
				group: 'General:',
				normalize: true
			})
			.option('update-check', {
				type: 'number',
				default: this.defaults.updateCheck,
				alias: 'U',
				describe: 'How frequently to check for an update (in minutes, use 0 to disable)',
				group: 'General:'
			})

			// Commands
			.option('command-prefix', {
				type: 'string',
				default: this.defaults.commandPrefix,
				alias: 'P',
				describe: 'Default command prefix (blank to use only mentions)',
				group: 'Commands:'
			})
			.option('command-editable', {
				type: 'number',
				default: this.defaults.commandEditable,
				alias: 'E',
				describe: 'How long a command message is editable (in seconds, use 0 to disable)',
				group: 'Commands:'
			})
			.option('non-command-edit', {
				type: 'boolean',
				default: this.defaults.nonCommandEdit,
				alias: 'N',
				describe: 'Whether or not a non-command message can be edited into a command',
				group: 'Commands:'
			})

			// Logging
			.option('log', {
				type: 'string',
				default: this.defaults.log,
				alias: 'l',
				describe: 'Path to log file',
				group: 'Logging:',
				normalize: true
			})
			.option('log-max-size', {
				type: 'number',
				default: this.defaults.logMaxSize,
				defaultDescription: '5MB',
				alias: 'S',
				describe: 'Maximum size of single log file (in bytes)',
				group: 'Logging:'
			})
			.option('log-max-files', {
				type: 'number',
				default: this.defaults.logMaxFiles,
				alias: 'F',
				describe: 'Maximum amount of log files to keep',
				group: 'Logging:'
			})
			.option('log-level', {
				type: 'string',
				default: this.defaults.logLevel,
				alias: 'L',
				describe: 'Log level to output to the log file (error, warn, info, verbose, debug)',
				group: 'Logging:'
			})
			.option('console-level', {
				type: 'string',
				default: this.defaults.consoleLevel,
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
		.argv;
		return yargs;
	}
}

const defaultDefaults = {
	playingGame: 'Message for help',
	paginationItems: 10,
	updateCheck: 60,
	commandPrefix: '!',
	commandEditable: 30,
	nonCommandEdit: true,
	autoReconnect: true,
	storage: 'bot-storage',
	log: 'bot.log',
	logMaxSize: 5242880,
	logMaxFiles: 5,
	logLevel: 'info',
	consoleLevel: 'info'
};

/**
 * @typedef {Object} ConfigObject
 * @property {string} [botName] - Name of the bot (required to create a client)
 * @property {string} [botVersion] - Version of the bot (should follow semver, required to create a client)
 * @property {string} [botAbout] - Text information about the bot for the about command
 * @property {string} [botUpdateURL] - URL to a package.json file to check for updates with
 * @property {string} [token] - The bot account API token to log in with
 * @property {string} [email] - The bot account email to log in with
 * @property {string} [password] - The bot account password to log in with
 * @property {boolean} [autoReconnect=true] - Whether or not the bot should automatically reconnect upon disconnection
 * @property {string} [storage=bot-storage] - Path to the local storage directory
 * @property {string} [playingGame=Message\ for\ help] - Text to show the bot playing
 * @property {number} [paginationItems=10] - Maximum number of items per page the default commands use when paginating
 * @property {number} [updateCheck=60] - How frequently to check for updates (in minutes)
 * @property {string} [commandPrefix=!] - The default command prefix (empty/null for mentions only)
 * @property {number} [commandEditable=30] - How long commands are editable (in seconds)
 * @property {boolean} [nonCommandEdit=true] - Whether or not commands will be run in messages that were edited that previously didn't have any commands
 * @property {string} [log=bot.log] - Path to the log file
 * @property {number} [logMaxSize=5242880] - Maximum size of the log file before splitting it (in bytes)
 * @property {number} [logMaxFiles=5] - Maximum log files to keep
 * @property {string} [logLevel=info] - The log level to output to the log file (error, warn, info, verbose, debug)
 * @property {string} [consoleLevel=info] - The log level to output to the console (error, warn, info, verbose, debug)
 */
