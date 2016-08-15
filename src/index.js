'use babel';
'use strict';

import Discord from 'discord.js';
import { LocalStorage } from 'node-localstorage';
import winston from 'winston';
import * as config from './config';
import version from './version';
import * as registry from './commands/registry';
import * as dispatcher from './commands/dispatcher';
import Setting from './database/setting';
import ModRole from './database/mod-role';
import UsableChannel from './database/usable-channel';
import * as permissions from './util/permissions';
import usage from './util/command-usage';
import disambiguation from './util/disambiguation';
import paginate from './util/pagination';
import search from './util/search';
import nbsp from './util/nbsp';
import * as patterns from './util/patterns';
import checkForUpdate from './util/update-check';
import FriendlyError from './util/errors/friendly';
import CommandFormatError from './util/errors/command-format';

import HelpCommand from './commands/general/help';
import AboutCommand from './commands/general/about';
import PrefixCommand from './commands/general/prefix';
import EvalCommand from './commands/general/eval';
import ListRolesCommand from './commands/general/list-roles';
import ListModRolesCommand from './commands/roles/list';
import AddModRoleCommand from './commands/roles/add';
import DeleteModRoleCommand from './commands/roles/delete';
import ClearModRolesCommand from './commands/roles/clear';
import ListAllowedChannelsCommand from './commands/channels/list';
import AllowChannelCommand from './commands/channels/allow';
import DisallowChannelCommand from './commands/channels/disallow';
import ClearAllowedChannelsCommand from './commands/channels/clear';

export const serverCommandPatterns = {};
export const unprefixedCommandPattern = /^([^\s]+)/i;

const graf = {
	client: null,
	config: config,
	version: version,
	registry: registry,
	dispatcher: dispatcher,
	permissions: permissions,
	storage: null,
	logger: null,
	util: {
		usage: usage,
		disambiguation: disambiguation,
		paginate: paginate,
		search: search,
		nbsp: nbsp,
		patterns: patterns
	},
	errors: {
		FriendlyError: FriendlyError,
		CommandFormatError: CommandFormatError
	},

	Setting: Setting,
	ModRole: ModRole,
	UsableChannel: UsableChannel,

	createClient(configObj) {
		config.setValues(configObj);
		this.createLogger();
		this.createStorage();

		// Output safe config
		const debugConfig = Object.assign({}, config.values);
		if(debugConfig.email) debugConfig.email = '--snip--';
		if(debugConfig.password) debugConfig.password = '--snip--';
		if(debugConfig.token) debugConfig.token = '--snip--';
		for(const key of Object.keys(debugConfig)) if(key.length === 1 || key.includes('-')) delete debugConfig[key];
		this.logger.debug('Configuration:', debugConfig);

		// Verify some stuff
		if(!config.values.token && (!config.values.email || !config.values.password)) throw new Error('Invalid credentials; either "token" or both "email" and "password" must be specified on the config.');
		if(!config.values.botName) throw new Error('"botName" must be specified on the config.');
		if(!config.values.botVersion) throw new Error('"botVersion" must be specified on the config.');

		// Create client
		const clientOptions = { autoReconnect: config.values.autoReconnect, forceFetchUsers: true, disableEveryone: config.values.disableEveryone };
		const client = new Discord.Client(clientOptions);
		this.logger.info('Client created.', clientOptions);
		client.on('error', err => { this.logger.error(err); });
		client.on('warn', err => { this.logger.warn(err); });
		client.on('debug', err => { this.logger.debug(err); });
		client.on('disconnected', () => { this.logger.error('Disconnected.'); });
		client.on('ready', () => {
			this.logger.info(`Bot is ready; logged in as ${client.user.username}#${client.user.discriminator} (ID: ${client.user.id})`);
			if(config.values.playingGame) client.setPlayingGame(config.values.playingGame);
		});

		// Set up command handling
		client.on('message', message => {
			if(message.author.equals(client.user)) return;
			dispatcher.handleMessage(message).catch(err => { this.logger.error(err); });
		});
		client.on('messageUpdated', (oldMessage, newMessage) => {
			if(newMessage.author.equals(client.user)) return;
			dispatcher.handleMessage(newMessage, oldMessage).catch(err => { this.logger.error(err); });
		});

		// Log in
		const loginCallback = err => { if(err) this.logger.error('Failed to login.', err); };
		if(config.values.token) {
			this.logger.info('Logging in with token...');
			client.loginWithToken(config.values.token, config.values.email, config.values.password, loginCallback);
		} else {
			this.logger.info('Logging in with email and password...');
			client.login(config.values.email, config.values.password, loginCallback);
		}

		// Check for updates now and at an interval
		if(config.values.updatePackageURL) {
			checkForUpdate();
			if(config.values.updateCheck > 0) setInterval(checkForUpdate, config.values.updateCheck * 60 * 1000);
		}

		this.client = client;
		return client;
	},

	registerCommands(commands) {
		for(const command of commands) this.registry.register(command);
	},

	nameGroups(groups) {
		for(const group of groups) this.registry.nameGroup(...group);
	},

	registerDefaultCommands() {
		this.registerCommands([
			HelpCommand,
			AboutCommand,
			PrefixCommand,
			EvalCommand,
			ListRolesCommand,
			ListModRolesCommand,
			AddModRoleCommand,
			DeleteModRoleCommand,
			ClearModRolesCommand,
			ListAllowedChannelsCommand,
			AllowChannelCommand,
			DisallowChannelCommand,
			ClearAllowedChannelsCommand
		]);
		this.nameGroups([
			['general', 'General'],
			['roles', 'Roles'],
			['channels', 'Channels']
		]);
	},

	createLogger() {
		if(!this.logger) {
			this.logger = new winston.Logger({
				transports: [
					new winston.transports.Console({
						level: config.values.consoleLevel,
						colorize: true,
						timestamp: true,
						handleExceptions: true,
						humanReadableUnhandledException: true
					})
				]
			});
			if(config.values.log) {
				this.logger.add(winston.transports.File, {
					level: config.values.logLevel,
					filename: config.values.log,
					maxsize: config.values.logMaxSize,
					maxFiles: config.values.logMaxFiles,
					tailable: true,
					json: false,
					handleExceptions: true,
					humanReadableUnhandledException: true
				});
			}
		} else {
			this.logger.debug('Not recreating logger.');
		}
	},

	createStorage() {
		if(!this.storage) this.storage = new LocalStorage(config.values.storage);
		else if(this.logger) this.logger.debug('Not recreating storage.');
	}
};
export default graf;
