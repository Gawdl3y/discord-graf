'use babel';
'use strict';

import { readFileSync } from 'fs';
import { join as pathJoin } from 'path';
import Discord from 'discord.js';
import { LocalStorage } from 'node-localstorage';
import winston from 'winston';
import request from 'request-promise-native';
import semver from 'semver';
import Config from './config';
import Registry from './commands/registry';
import Dispatcher from './commands/dispatcher';
import _Command from './commands/command';
import _Module from './commands/module';
import _Permissions from './permissions';
import _Util from './util';
import _Setting from './data/models/setting';
import _Storage from './data/storage';
import SettingStorage from './data/settings';
import ModRoleStorage from './data/mod-roles';
import AllowedChannelStorage from './data/allowed-channels';
import _FriendlyError from './errors/friendly';
import _CommandFormatError from './errors/command-format';

import HelpCommand from './commands/info/help';
import AboutCommand from './commands/info/about';
import ListModulesCommand from './commands/modules/list';
import ToggleModuleCommand from './commands/modules/toggle';
import EnableModuleCommand from './commands/modules/enable';
import DisableModuleCommand from './commands/modules/disable';
import ListModRolesCommand from './commands/mod-roles/list';
import AddModRoleCommand from './commands/mod-roles/add';
import DeleteModRoleCommand from './commands/mod-roles/delete';
import ClearModRolesCommand from './commands/mod-roles/clear';
import ListAllowedChannelsCommand from './commands/channels/list-allowed';
import AllowChannelCommand from './commands/channels/allow';
import DisallowChannelCommand from './commands/channels/disallow';
import ClearAllowedChannelsCommand from './commands/channels/clear-allowed';
import PrefixCommand from './commands/util/prefix';
import EvalCommand from './commands/util/eval';

export const version = JSON.parse(readFileSync(pathJoin(__dirname, '../package.json'))).version;
export const Command = _Command;
export const Module = _Module;
export const Permissions = _Permissions;
export const Util = _Util;
export const Storage = _Storage;
export const Setting = _Setting;
export const FriendlyError = _FriendlyError;
export const CommandFormatError = _CommandFormatError;
export const defaultClientOptions = {
	forceFetchUsers: true,
	bot: true
};

export class Bot {
	constructor(config) {
		this.config = new Config(config);
		this.permissions = null;
		this.util = null;
		this.localStorage = null;
		this.storage = {
			settings: null,
			modRoles: null,
			allowedChannels: null
		};
		this.evalObjects = {};
	}

	createClient() {
		if(this.client) throw new Error('Client has already been created.');
		const config = this.config.values;

		// Verify some stuff
		if(!config.token && (!config.email || !config.password)) throw new Error('Invalid credentials; either "token" or both "email" and "password" must be specified on the config.');
		if(!config.botName) throw new Error('"botName" must be specified on the config.');
		if(!config.botVersion) throw new Error('"botVersion" must be specified on the config.');

		// Output safe config
		const debugConfig = Object.assign({}, config);
		if(debugConfig.email) debugConfig.email = '--snip--';
		if(debugConfig.password) debugConfig.password = '--snip--';
		if(debugConfig.token) debugConfig.token = '--snip--';
		for(const key of Object.keys(debugConfig)) if(key.length === 1 || key.includes('-')) delete debugConfig[key];
		this.logger.debug('Configuration:', debugConfig);

		// Create client and bot classes
		const clientOptions = Object.assign({}, defaultClientOptions, config.clientOptions, { autoReconnect: config.autoReconnect });
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

		// Set up logging, playing game text, and update checking
		client.on('error', err => { this.logger.error(err); });
		client.on('warn', err => { this.logger.warn(err); });
		client.on('debug', err => { this.logger.debug(err); });
		client.on('disconnected', () => { this.logger.error('Disconnected.'); });
		client.on('ready', () => {
			this.logger.info(`Bot is ready; logged in as ${client.user.username}#${client.user.discriminator} (ID: ${client.user.id})`);
			if(config.playingGame) client.setPlayingGame(config.playingGame);
			if(config.botUpdateURL) {
				this._checkForUpdate();
				if(config.updateCheck > 0) setInterval(this._checkForUpdate.bind(this), config.updateCheck * 60 * 1000);
			}
		});

		// Set up command handling
		client.on('message', message => {
			this.dispatcher.handleMessage(message).catch(err => { this.logger.error(err); });
		});
		client.on('messageUpdated', (oldMessage, newMessage) => {
			this.dispatcher.handleMessage(newMessage, oldMessage).catch(err => { this.logger.error(err); });
		});

		// Log in
		const loginCallback = err => { if(err) this.logger.error('Failed to login.', err); };
		if(config.token) {
			this.logger.info('Logging in with token...');
			client.loginWithToken(config.token, config.email, config.password, loginCallback);
		} else {
			this.logger.info('Logging in with email and password...');
			client.login(config.email, config.password, loginCallback);
		}

		return client;
	}

	registerCommand(command) {
		return this.registerCommands([command]);
	}

	registerCommands(commands) {
		if(!Array.isArray(commands)) throw new TypeError('Commands must be an array.');
		for(let i = 0; i < commands.length; i++) if(typeof commands[i] === 'function') commands[i] = new commands[i](this);
		this.registry.registerCommands(commands);
		return this;
	}

	registerModule(module) {
		return this.registerModules([module]);
	}

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

	registerDefaults() {
		this.registerDefaultModules();
		this.registerDefaultCommands();
		return this;
	}

	registerDefaultModules() {
		this.registerModules([
			['info', 'Information'],
			['modules', 'Modules'],
			['mod-roles', 'Moderator roles'],
			['channels', 'Channels'],
			['util', 'Utility']
		]);
		return this;
	}

	registerDefaultCommands() {
		this.registerCommands([
			HelpCommand,
			AboutCommand,
			ListModulesCommand,
			ToggleModuleCommand,
			EnableModuleCommand,
			DisableModuleCommand,
			ListModRolesCommand,
			AddModRoleCommand,
			DeleteModRoleCommand,
			ClearModRolesCommand,
			ListAllowedChannelsCommand,
			AllowChannelCommand,
			DisallowChannelCommand,
			ClearAllowedChannelsCommand,
			PrefixCommand,
			EvalCommand
		]);
		return this;
	}

	registerEvalObject(key, obj) {
		const registerObj = {};
		registerObj[key] = obj;
		return this.registerEvalObjects(registerObj);
	}

	registerEvalObjects(obj) {
		Object.assign(this.evalObjects, obj);
		return this;
	}

	get registry() {
		if(!this._registry) this._registry = new Registry(this.logger);
		return this._registry;
	}

	get logger() {
		if(!this._logger) {
			this._logger = new winston.Logger({
				transports: [
					new winston.transports.Console({
						level: this.config.values.consoleLevel,
						colorize: true,
						timestamp: true,
						handleExceptions: true,
						humanReadableUnhandledException: true
					})
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
					humanReadableUnhandledException: true
				});
			}
		}
		return this._logger;
	}

	/**
	 * Checks for an update for the bot
	 * @return {void}
	 */
	_checkForUpdate() {
		const config = this.config.values;
		request(config.botUpdateURL).then(body => {
			const masterVersion = JSON.parse(body).version;
			if(!semver.gt(masterVersion, config.botVersion)) return;
			const message = `An update for ${config.botName} is available! Current version is ${config.botVersion}, latest available is ${masterVersion}.`;
			this.logger.warn(message);
			const savedVersion = this.storage.settings.getValue(null, 'notified-version');
			if(savedVersion !== masterVersion && this.client && config.owner) {
				this.client.sendMessage(config.owner, message);
				this.storage.settings.save(new Setting(null, 'notified-version', masterVersion));
			}
		}).catch(err => {
			this.logger.error(err);
		});
	}
}

export default Bot;

/** @external {Client} http://discordjs.readthedocs.io/en/latest/docs_client.html */
/** @external {User} http://discordjs.readthedocs.io/en/latest/docs_user.html */
/** @external {Server} http://discordjs.readthedocs.io/en/latest/docs_server.html */
/** @external {Channel} http://discordjs.readthedocs.io/en/latest/docs_channel.html */
/** @external {Message} http://discordjs.readthedocs.io/en/latest/docs_message.html */
