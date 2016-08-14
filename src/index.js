'use babel';
'use strict';

import Discord from 'discord.js';
import { LocalStorage } from 'node-localstorage';
import winston from 'winston';
import config from './config';
import version from './version';
import * as registry from './commands';
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

const bot = {
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

	createClient(configObj = null) {
		if(configObj) Object.assign(config, configObj);
		if(!this.logger) this.createLogger();

		// Output safe config
		const debugConfig = Object.assign({}, config);
		if(debugConfig.email) debugConfig.email = '--snip--';
		if(debugConfig.password) debugConfig.password = '--snip--';
		if(debugConfig.token) debugConfig.token = '--snip--';
		for(const key of Object.keys(debugConfig)) if(key.length === 1 || key.includes('-')) delete debugConfig[key];
		this.logger.debug('Configuration:', debugConfig);

		// Verify some stuff
		if(!config.token && (!config.email || !config.password)) throw new Error('Invalid credentials; either "token" or both "email" and "password" must be specified on the config.');
		if(!config.botName) throw new Error('"botName" must be specified on the config.');
		if(!config.botVersion) throw new Error('"botVersion" must be specified on the config.');

		// Create client and storage
		if(!this.storage) this.createStorage();
		const clientOptions = { autoReconnect: config.autoReconnect, forceFetchUsers: true, disableEveryone: true };
		const client = new Discord.Client(clientOptions);
		this.logger.info('Client created.', clientOptions);
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
			if(message.author.equals(client.user)) return;
			dispatcher.handleMessage(message).catch(err => { this.logger.error(err); });
		});
		client.on('messageUpdated', (oldMessage, newMessage) => {
			if(newMessage.author.equals(client.user)) return;
			dispatcher.handleMessage(newMessage, oldMessage).catch(err => { this.logger.error(err); });
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

	checkForUpdate(packageURL) {
		config.updatePackageURL = packageURL;
		checkForUpdate();
		if(config.updateCheck > 0) setInterval(checkForUpdate, config.updateCheck * 60 * 1000);
	},

	createLogger() {
		this.logger = new winston.Logger({
			transports: [
				new winston.transports.Console({
					level: config.consoleLevel,
					colorize: true,
					timestamp: true,
					handleExceptions: true,
					humanReadableUnhandledException: true
				})
			]
		});
		if(config.log) {
			this.logger.add(winston.transports.File, {
				level: config.logLevel,
				filename: config.log,
				maxsize: config.logMaxSize,
				maxFiles: config.logMaxFiles,
				tailable: true,
				json: false,
				handleExceptions: true,
				humanReadableUnhandledException: true
			});
		}
	},

	createStorage() {
		this.storage = new LocalStorage(config.storage);
	}
};
export default bot;
