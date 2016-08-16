'use babel';
'use strict';

import Discord from 'discord.js';
import { LocalStorage } from 'node-localstorage';
import winston from 'winston';
import request from 'request';
import semver from 'semver';
import version from './version';
import Config from './config';
import Permissions from './permissions';
import Registry from './commands/registry';
import Dispatcher from './commands/dispatcher';
import Command from './commands/command';
import Util from './util';
import Setting from './data/models/setting';
import SettingStorage from './data/settings';
import ModRoleStorage from './data/mod-roles';
import AllowedChannelStorage from './data/allowed-channels';
import FriendlyError from './errors/friendly';
import CommandFormatError from './errors/command-format';

// import HelpCommand from './commands/general/help';
// import AboutCommand from './commands/general/about';
// import PrefixCommand from './commands/general/prefix';
// import EvalCommand from './commands/general/eval';
// import ListRolesCommand from './commands/general/list-roles';
// import ListModRolesCommand from './commands/roles/list';
// import AddModRoleCommand from './commands/roles/add';
// import DeleteModRoleCommand from './commands/roles/delete';
// import ClearModRolesCommand from './commands/roles/clear';
// import ListAllowedChannelsCommand from './commands/channels/list';
// import AllowChannelCommand from './commands/channels/allow';
// import DisallowChannelCommand from './commands/channels/disallow';
// import ClearAllowedChannelsCommand from './commands/channels/clear';

export default class GrafBot {
	constructor(config) {
		this.version = version;
		this.config = new Config(config);
		this.registry = null;
		this.permissions = null;
		this.util = null;
		this.localStorage = null;
		this.data = {
			settings: null,
			modRoles: null,
			allowedChannels: null
		};
		this.errors = {
			FriendlyError: FriendlyError,
			CommandFormatError: CommandFormatError
		};
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
		const clientOptions = { autoReconnect: config.autoReconnect, forceFetchUsers: true, disableEveryone: config.disableEveryone };
		const client = new Discord.Client(clientOptions);
		this.client = client;
		this.localStorage = new LocalStorage(config.storage);
		this.data.settings = new SettingStorage(this.localStorage, this.logger);
		this.data.modRoles = new ModRoleStorage(this.localStorage, this.logger);
		this.data.allowedChannels = new AllowedChannelStorage(this.localStorage, this.logger);
		this.registry = new Registry(this.logger);
		this.dispatcher = new Dispatcher(client, this.registry, this.data.settings, this.config);
		this.permissions = new Permissions(client, this.data.modRoles, this.config);
		this.util = new Util(client, this.data.settings, this.config);
		this.logger.info('Client created.', clientOptions);

		// Set up logging and the playing game text
		client.on('error', err => { this.logger.error(err); });
		client.on('warn', err => { this.logger.warn(err); });
		client.on('debug', err => { this.logger.debug(err); });
		client.on('disconnected', () => { this.logger.error('Disconnected.'); });
		client.on('ready', () => {
			this.logger.info(`Bot is ready; logged in as ${client.user.username}#${client.user.discriminator} (ID: ${client.user.id})`);
			if(config.playingGame) client.setPlayingGame(config.playingGame);
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

		// Check for updates now and at an interval
		if(config.botUpdateURL) {
			this._checkForUpdate();
			if(config.updateCheck > 0) setInterval(() => this._checkForUpdate, config.updateCheck * 60 * 1000);
		}
	}

	registerCommands(commands) {
		this.registry.register(commands);
	}

	nameGroups(groups) {
		for(const group of groups) this.registry.nameGroup(...group);
	}

	registerDefaultCommands() {
		this.registerCommands([
			// HelpCommand,
			// AboutCommand,
			// PrefixCommand,
			// EvalCommand,
			// ListRolesCommand,
			// ListModRolesCommand,
			// AddModRoleCommand,
			// DeleteModRoleCommand,
			// ClearModRolesCommand,
			// ListAllowedChannelsCommand,
			// AllowChannelCommand,
			// DisallowChannelCommand,
			// ClearAllowedChannelsCommand
		]);
		this.nameGroups([
			['general', 'General'],
			['roles', 'Roles'],
			['channels', 'Channels']
		]);
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
	 * @param {Client} client - The Discord.js Client instance
	 * @return {void}
	 */
	_checkForUpdate() {
		const config = this.config.values;
		request(config.botUpdateURL, (error, response, body) => {
			if(error) {
				this.logger.warn('Error while checking for update', error);
				return;
			}
			if(response.statusCode !== 200) {
				this.logger.warn('Error while checking for update', { statusCode: response.statusCode });
				return;
			}

			const masterVersion = JSON.parse(body).version;
			if(!semver.gt(masterVersion, config.botVersion)) return;
			const message = `An update for ${config.values.botName} is available! Current version is ${config.botVersion}, latest available is ${masterVersion}.`;
			if(this.logger) this.logger.warn(message);
			const savedVersion = this.data.settings.getValue('notified-version');
			if(savedVersion !== masterVersion && this.client && config.owner) {
				this.client.sendMessage(config.owner, message);
				this.data.settings.save(new Setting(null, 'notified-version', masterVersion));
			}
		});
	}

	static get Command() {
		return Command;
	}
}
