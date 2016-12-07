'use babel';
'use strict';

import Discord from 'discord.js';
import { LocalStorage } from 'node-localstorage';
import winston from 'winston';
import request from 'request-promise-native';
import semver from 'semver';
import Config from './config';
import Permissions from './permissions';
import Util from './util';
import Registry from '../commands/registry';
import Dispatcher from '../commands/dispatcher';
import Module from '../commands/module';
import CommandBuilder from '../commands/builder';
import Setting from '../storage/models/setting';
import SettingStorage from '../storage/settings';
import ModRoleStorage from '../storage/mod-roles';
import AllowedChannelStorage from '../storage/allowed-channels';

import HelpCommand from '../commands/info/help';
import AboutCommand from '../commands/info/about';
import ListModulesCommand from '../commands/modules/list';
import ToggleModuleCommand from '../commands/modules/toggle';
import EnableModuleCommand from '../commands/modules/enable';
import DisableModuleCommand from '../commands/modules/disable';
import ListModRolesCommand from '../commands/mod-roles/list';
import AddModRoleCommand from '../commands/mod-roles/add';
import DeleteModRoleCommand from '../commands/mod-roles/delete';
import ClearModRolesCommand from '../commands/mod-roles/clear';
import ListAllowedChannelsCommand from '../commands/channels/list-allowed';
import AllowChannelCommand from '../commands/channels/allow';
import DisallowChannelCommand from '../commands/channels/disallow';
import ClearAllowedChannelsCommand from '../commands/channels/clear-allowed';
import PrefixCommand from '../commands/util/prefix';
import EvalCommand from '../commands/util/eval';
import ShowBlacklistCommand from '../commands/blacklist/show';
import BlacklistUserCommand from '../commands/blacklist/user';
import BlacklistGuildCommand from '../commands/blacklist/guild';

/** A Discord bot that has its own command registry, storage, utilities, etc. */
export default class Bot {
	/** @param {ConfigObject} config - The configuration to use */
	constructor(config) {
		/** @type {Client} */
		this.client = null;
		/** @type {CommandDispatcher} */
		this.dispatcher = null;
		/** @type {BotConfig} */
		this.config = new Config(config);
		/** @type {BotPermissions} */
		this.permissions = null;
		/** @type {BotUtil} */
		this.util = null;
		/** @type {LocalStorage} */
		this.localStorage = null;
		/**
		 * @type {Object}
		 * @property {SettingStorage} settings
		 * @property {ModRoleStorage} modRoles
		 * @property {AllowedChannelStorage} allowedChannels
		 */
		this.storage = {
			settings: null,
			modRoles: null,
			allowedChannels: null
		};
		/** @type {Object} */
		this.evalObjects = {};
	}

	/**
	 * Instantiates all bot classes and storages, and creates the client
	 * @return {Client} The bot client
	 */
	createClient() {
		if(this.client) throw new Error('Client has already been created.');
		const config = this.config.values;
		if(config.selfbot) config.clientOptions.bot = false;

		// Verify some stuff
		if(!config.token && (!config.email || !config.password)) throw new Error('Invalid credentials; either "token" or both "email" and "password" must be specified on the config.');
		if(!config.name) throw new Error('"name" must be specified on the config.');
		if(!config.version) throw new Error('"version" must be specified on the config.');

		// Output safe config
		const debugConfig = Object.assign({}, config);
		if(debugConfig.email) debugConfig.email = '--snip--';
		if(debugConfig.password) debugConfig.password = '--snip--';
		if(debugConfig.token) debugConfig.token = '--snip--';
		if(debugConfig.carbonKey) debugConfig.carbonKey = '--snip--';
		if(debugConfig.bdpwKey) debugConfig.bdpwKey = '--snip--';
		for(const key of Object.keys(debugConfig)) if(key.length === 1 || key.includes('-')) delete debugConfig[key];
		this.logger.debug('Configuration:', debugConfig);

		// Create client and bot classes
		const clientOptions = Object.assign({}, defaultClientOptions, config.clientOptions);
		const client = new Discord.Client(clientOptions);
		this.client = client;
		this.localStorage = new LocalStorage(config.storage);
		this.storage.settings = new SettingStorage(this.localStorage, this.logger);
		this.storage.modRoles = new ModRoleStorage(this.localStorage, this.logger);
		this.storage.allowedChannels = new AllowedChannelStorage(this.localStorage, this.logger);
		this.dispatcher = new Dispatcher(this);
		this.permissions = new Permissions(client, this.storage.modRoles, this.storage.settings, this.config);
		this.util = new Util(client, this.storage.settings, this.config);
		this.logger.info('Client created.', clientOptions);

		// Set up logging and the playing game text
		client.on('error', err => { this.logger.error(err); });
		client.on('warn', msg => { this.logger.warn(msg); });
		client.on('debug', msg => { this.logger.debug(msg); });
		client.on('disconnect', () => { this.logger.warn('Disconnected.'); });
		client.on('reconnecting', () => { this.logger.warn('Reconnecting...'); });
		client.on('guildCreate', guild => { this.logger.info(`Joined guild ${guild} (ID: ${guild.id}).`); });
		client.on('guildDelete', guild => { this.logger.info(`Left guild ${guild} (ID: ${guild.id}).`); });
		client.on('ready', () => {
			this.logger.info(`Bot is ready; logged in as ${client.user.username}#${client.user.discriminator} (ID: ${client.user.id})`);
			if(config.playingGame) client.user.setGame(config.playingGame);
		});

		// Set up command handling
		const messageErr = err => { this.logger.error('Error while handling message. This may be an issue with GRAF.', err); };
		client.on('message', message => {
			this._logMessage(message);
			this.dispatcher.handleMessage(message).catch(messageErr);
		});
		client.on('messageUpdate', (oldMessage, newMessage) => {
			this._logMessage(newMessage, oldMessage);
			this.dispatcher.handleMessage(newMessage, oldMessage).catch(messageErr);
		});

		// Set up guild blacklisting
		client.on('guildCreate', guild => {
			const guilds = this.storage.settings.getValue(null, 'blacklisted-guilds');
			if(guilds && guilds.includes(guild.id)) {
				this.logger.info('Guild is blacklisted; leaving.', { name: guild.name, id: guild.id });
				guild.leave();
			}
		});

		// Remove channels/roles from storages upon their deletion
		client.on('channelDelete', channel => {
			if(channel.guild && this.storage.allowedChannels.exists(channel.guild, channel.id)) {
				this.logger.verbose('Removing orphaned allowed channel.', { guild: channel.guild ? channel.guild.id : null, channel: channel.id });
				this.storage.allowedChannels.delete(channel);
			}
		});
		client.on('roleDelete', role => {
			if(this.storage.modRoles.exists(role.guild, role.id)) {
				this.logger.verbose('Removing orphaned mod role.', { guild: role.guild.id, role: role.id });
				this.storage.modRoles.delete(role);
			}
		});

		// Fetch the owner
		if(config.owner) {
			client.once('ready', () => {
				client.fetchUser(config.owner).catch((err) => { this.logger.error('Unable to fetch the owner user.', err); });
			});
		}

		// Set up update checking
		if(config.updateURL) {
			client.once('ready', () => {
				this._checkForUpdate();
				if(config.updateCheck > 0) setInterval(this._checkForUpdate.bind(this), config.updateCheck * 60 * 1000);
			});
		}

		// Set up Carbon guild count updates
		if(config.carbonUrl && config.carbonKey) {
			client.once('ready', this._sendCarbonStats.bind(this));
			client.on('guildCreate', this._sendCarbonStats.bind(this));
			client.on('guildDelete', this._sendCarbonStats.bind(this));
		}

		// Set up BDPW guild count updates
		if(config.bdpwUrl && config.bdpwKey) {
			client.once('ready', this._sendBDPWStats.bind(this));
			client.on('guildCreate', this._sendBDPWStats.bind(this));
			client.on('guildDelete', this._sendBDPWStats.bind(this));
		}

		// Log in
		const loginErr = err => {
			this.logger.error('Failed to login.');
			this.logger.error(err);
		};
		if(config.token) {
			this.logger.info('Logging in with token...');
			client.login(config.token).catch(loginErr);
		} else {
			this.logger.info('Logging in with email and password...');
			client.login(config.email, config.password).catch(loginErr);
		}

		return client;
	}

	/**
	 * Create a command builder
	 * @param {CommandInfo} [info] - The command information
	 * @param {CommandBuilderFunctions} [funcs] - The command functions to set
	 * @return {CommandBuilder} The builder
	 */
	buildCommand(info = null, funcs = null) {
		return new CommandBuilder(this, info, funcs);
	}

	/**
	 * Registers a single command to the bot's registry
	 * @param {Command|function} command - Either a Command instance, or a constructor for one
	 * @return {Bot} This bot
	 * @see {@link Bot#registerCommands}
	 */
	registerCommand(command) {
		return this.registerCommands([command]);
	}

	/**
	 * Registers multiple commands to the bot's registry
	 * @param {Command[]|function[]} commands - An array of Command instances or constructors
	 * @return {Bot} This bot
	 */
	registerCommands(commands) {
		if(!Array.isArray(commands)) throw new TypeError('Commands must be an array.');
		for(let i = 0; i < commands.length; i++) if(typeof commands[i] === 'function') commands[i] = new commands[i](this);
		this.registry.registerCommands(commands);
		return this;
	}

	/**
	 * Registers a single module to the bot's registry
	 * @param {Module|function|string[]} module - A Module instance, a constructor, or an array of [ID, Name]
	 * @return {Bot} This bot
	 * @see {@link Bot#registerModules}
	 */
	registerModule(module) {
		return this.registerModules([module]);
	}

	/**
	 * Registers multiple modules to the bot's registry
	 * @param {Module[]|function[]|Array[]} modules - An array of Module instances, constructors, or arrays of [ID, Name]
	 * @return {Bot} This bot
	 */
	registerModules(modules) {
		if(!Array.isArray(modules)) throw new TypeError('Modules must be an array.');
		for(let i = 0; i < modules.length; i++) {
			if(typeof modules[i] === 'function') {
				modules[i] = new modules[i](this);
			} else if(Array.isArray(modules[i])) {
				modules[i] = new Module(this, ...modules[i]);
			} else if(!(modules[i] instanceof Module)) {
				modules[i] = new Module(this, modules[i].id, modules[i].name, modules[i].commands);
			}
		}
		this.registry.registerModules(modules);
		return this;
	}

	/**
	 * Registers both the default modules and commands to the bot's registry
	 * @return {Bot} This bot
	 */
	registerDefaults() {
		this.registerDefaultModules();
		this.registerDefaultCommands();
		return this;
	}

	/**
	 * Registers the default modules to the bot's registry
	 * @return {Bot} This bot
	 */
	registerDefaultModules() {
		this.registerModules([
			['info', 'Information'],
			['mod-roles', 'Moderator roles'],
			['channels', 'Channels'],
			['util', 'Utility'],
			['modules', 'Modules', true],
			['blacklist', 'Blacklisting', true]
		]);
		return this;
	}

	/**
	 * Registers the default commands to the bot's registry
	 * @param {Object} [options] - Object specifying what commands to register
	 * @param {boolean} [options.about=true] - Whether or not to register the built-in about command
	 * @param {boolean} [options.modRoles=true] - Whether or not to register the built-in mod roles commands
	 * @param {boolean} [options.channels=true] - Whether or not to register the built-in channels commands
	 * @param {boolean} [options.blacklist=true] - Whether or not to register the built-in blacklist commands
	 * @return {Bot} This bot
	 */
	registerDefaultCommands({ about = true, modRoles = true, channels = true, blacklist = true } = {}) {
		this.registerCommands([
			HelpCommand,
			PrefixCommand,
			EvalCommand,
			ListModulesCommand,
			ToggleModuleCommand,
			EnableModuleCommand,
			DisableModuleCommand
		]);
		if(about) this.registerCommand(AboutCommand);
		if(modRoles) {
			this.registerCommands([
				ListModRolesCommand,
				AddModRoleCommand,
				DeleteModRoleCommand,
				ClearModRolesCommand
			]);
		}
		if(channels) {
			this.registerCommands([
				ListAllowedChannelsCommand,
				AllowChannelCommand,
				DisallowChannelCommand,
				ClearAllowedChannelsCommand
			]);
		}
		if(blacklist) {
			this.registerCommands([
				ShowBlacklistCommand,
				BlacklistUserCommand,
				BlacklistGuildCommand
			]);
		}
		return this;
	}

	/**
	 * Registers a single object to be usable by the eval command
	 * @param {string} key - The key for the object
	 * @param {Object} obj - The object
	 * @return {Bot} This bot
	 * @see {@link Bot#registerEvalObjects}
	 */
	registerEvalObject(key, obj) {
		const registerObj = {};
		registerObj[key] = obj;
		return this.registerEvalObjects(registerObj);
	}

	/**
	 * Registers multiple objects to be usable by the eval command
	 * @param {Object} obj - An object of keys: values
	 * @return {Bot} This bot
	 */
	registerEvalObjects(obj) {
		Object.assign(this.evalObjects, obj);
		return this;
	}

	/** @type {CommandRegistry} */
	get registry() {
		if(!this._registry) this._registry = new Registry(this.logger);
		return this._registry;
	}

	/** @type {Logger} */
	get logger() {
		if(!this._logger) {
			const timestamp = () => {
				const dt = new Date();
				const min = dt.getUTCMinutes();
				const sec = dt.getUTCSeconds();
				const ms = dt.getUTCMilliseconds();
				return `${dt.getUTCFullYear()}-${dt.getUTCMonth()}-${dt.getUTCDate()} `
					+ `${dt.getUTCHours()}:${min >= 10 ? min : `0${min}`}:${sec >= 10 ? sec : `0${sec}`}.${ms >= 100 ? ms : ms > 10 ? `0${ms}` : `00${ms}`}`;
			};

			this._logger = new winston.Logger({
				levels: {
					error: 0,
					warn: 1,
					info: 2,
					verbose: 3,
					message: 4,
					debug: 5
				},
				colors: {
					error: 'red',
					warn: 'yellow',
					info: 'green',
					verbose: 'blue',
					message: 'cyan',
					debug: 'magenta'
				},
				transports: [
					new winston.transports.Console({
						level: this.config.values.consoleLevel,
						colorize: true,
						handleExceptions: true,
						humanReadableUnhandledException: true,
						timestamp
					})
				],
				filters: [
					(lvl, msg) => this.client && this.client.options.shardCount > 0 ? `[${this.client.options.shardId}] ${msg}` : msg
				]
			});
			if(this.config.values.log) {
				this._logger.add(winston.transports.File, {
					level: this.config.values.logLevel,
					filename: this.config.values.log,
					maxsize: this.config.values.logMaxSize,
					maxFiles: this.config.values.logMaxFiles,
					tailable: true,
					json: false,
					handleExceptions: true,
					humanReadableUnhandledException: true,
					timestamp
				});
			}
		}
		return this._logger;
	}

	/**
	 * Logs a message
	 * @param {Message} message - The message
	 * @param {Message} [oldMessage] - The old message if edited
	 */
	_logMessage(message, oldMessage = null) {
		if(!this.config.values.logMessages) return;
		if(oldMessage && message.content === oldMessage.content) return;
		const prefix = `${message.guild ? `[${message.guild.name}][${message.channel.name}]` : '[DM]'} ${message.author.username}#${message.author.discriminator}`;
		this.logger.message(`${prefix}: ${message.content}`);
		if(oldMessage) this.logger.message(`${prefix} EDITED FROM: ${oldMessage.content}`);
	}

	/**
	 * Checks for an update for the bot
	 */
	_checkForUpdate() {
		const config = this.config.values;
		request(config.updateURL).then(body => {
			const masterVersion = JSON.parse(body).version;
			if(!semver.gt(masterVersion, config.version)) return;
			const message = `An update for ${config.name} is available! Current version is ${config.version}, latest available is ${masterVersion}.`;
			this.logger.warn(message);
			const savedVersion = this.storage.settings.getValue(null, 'notified-version');
			if(savedVersion !== masterVersion && this.client && config.owner) {
				this.client.users.get(config.owner).sendMessage(message);
				this.storage.settings.save(new Setting(null, 'notified-version', masterVersion));
			}
		}).catch(err => {
			this.logger.error('Error while checking for an update', err);
		});
	}

	/**
	 * Sends guild count to Carbon
	 */
	_sendCarbonStats() {
		const config = this.config.values;
		request({
			method: 'POST',
			uri: config.carbonUrl,
			body: Object.assign(this._stats, { key: config.carbonKey }),
			json: true
		}).then(() => {
			this.logger.info(`Sent guild count to Carbon with ${this.client.guilds.size} guilds.`);
		}).catch(err => {
			this.logger.error('Error while sending guild count to Carbon.', err);
		});
	}

	/**
	 * Sends guild count to bots.discord.pw
	 */
	_sendBDPWStats() {
		const config = this.config.values;
		request({
			method: 'POST',
			uri: `${config.bdpwUrl}/bots/${this.client.user.id}/stats`,
			headers: { Authorization: config.bdpwKey },
			body: this._stats,
			json: true
		}).then(() => {
			this.logger.info(`Sent guild count to bots.discord.pw with ${this.client.guilds.size} guilds.`);
		}).catch(err => {
			this.logger.error('Error while sending guild count to bots.discord.pw.', err);
		});
	}

	/**
	 * Stats object to send to Carbon/BDPW
	 * @type {Object}
	 */
	get _stats() {
		/* eslint-disable camelcase */
		const body = { server_count: this.client.guilds.size };
		if(this.client.options.shardCount > 0) {
			body.shard_id = this.client.options.shardId;
			body.shard_count = this.client.options.shardCount;
		}
		/* eslint-enable camelcase */
		return body;
	}
}

const defaultClientOptions = { bot: true };
