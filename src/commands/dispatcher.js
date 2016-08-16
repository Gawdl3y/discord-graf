'use babel';
'use strict';

import stringArgv from 'string-argv';
import { stripIndents } from 'common-tags';
import escapeRegex from 'escape-string-regexp';
import Command from './command';
import FriendlyError from '../errors/friendly';

export default class CommandDispatcher {
	constructor(client, registry, bot, settings, config, logger) {
		if(!client || !registry || !bot || !config || !settings) throw new Error('client, registry, bot, settings, and config must be specified.');
		this.client = client;
		this.registry = registry;
		this.bot = bot;
		this.settings = settings;
		this.config = config;
		this.logger = logger;
		this._serverCommandPatterns = {};
		this._results = {};
	}

	async handleMessage(message, oldMessage = null) {
		if(message.author.equals(this.client.user)) return;

		// Make sure the bot is allowed to run in the channel, or the user is an admin
		if(message.server && !this.settings.isEmpty(message.server)
			&& !this.settings.exists(message.server, message.channel)
			&& !this.permissions.isAdmin(message.server, message.author)) return;

		// Parse the message, and get the old result if it exists
		const [command, args, fromPattern, isCommandMessage] = this.parseMessage(message);
		const oldResult = oldMessage ? this.results[oldMessage.id] : null;

		// Run the command, or make an error message result
		let result;
		if(command) {
			if(!oldMessage || oldResult) result = this.constructor.makeResultObject(await this.run(command, args, fromPattern, message));
		} else if(isCommandMessage) {
			result = { reply: [`Unknown command. Use ${this.util.usage('help', message.server)} to view the list of all commands.`], editable: true };
		} else if(this.config.nonCommandEdit) {
			result = {};
		}

		if(result) {
			// Change a plain or reply response into direct if there isn't a server
			if(!message.server) {
				if(!result.direct) result.direct = result.plain || result.reply;
				delete result.plain;
				delete result.reply;
			}

			// Update old messages or send new ones
			if(oldResult && (oldResult.plain || oldResult.reply || oldResult.direct)) {
				await this.updateMessagesForResult(message, result, oldResult);
			} else {
				await this.sendMessagesForResult(message, result);
			}

			// Cache the result
			if(this.config.values.commandEditable > 0) {
				if(result.editable) {
					result.timeout = oldResult && oldResult.timeout ? oldResult.timeout : setTimeout(() => { delete this.results[message.id]; }, this.config.values.commandEditable * 1000);
					this.results[message.id] = result;
				} else {
					delete this.results[message.id];
				}
			}
		}
	}

	async run(command, args, fromPattern, message) {
		const logInfo = {
			args: String(args),
			user: `${message.author.username}#${message.author.discriminator}`,
			userID: message.author.id,
			server: message.server ? message.server.name : null,
			serverID: message.server ? message.server.id : null
		};

		// Make sure the command is usable
		if(command.serverOnly && !message.server) {
			if(this.logger) this.logger.info(`Not running ${command.group}:${command.groupName}; server only.`, logInfo);
			return `The \`${command.name}\` command must be used in a server channel.`;
		}
		if(command.isRunnable && !command.isRunnable(message)) {
			if(this.logger) this.logger.info(`Not running ${command.group}:${command.groupName}; not runnable.`, logInfo);
			return `You do not have permission to use the \`${command.name}\` command.`;
		}

		// Run the command
		if(this.logger) this.logger.info(`Running ${command.group}:${command.groupName}.`, logInfo);
		try {
			const runArgs = [message, args, fromPattern];
			if(!(command instanceof Command)) runArgs.unshift(this.bot);
			return await command.run(...runArgs);
		} catch(err) {
			if(err instanceof FriendlyError) {
				return err.message;
			} else {
				if(this.logger) this.logger.error(err);
				const owner = this.config.values.owner ? message.client.users.get('id', this.config.values.owner) : null;
				return stripIndents`
					An error occurred while running the command: \`${err.name}: ${err.message}\`
					${owner ? `Please contact ${owner.name}#${owner.discriminator}${this.config.values.invite ? ` in this server: ${this.config.values.invite}` : '.'}` : ''}
				`;
			}
		}
	}

	async sendMessagesForResult(message, result) {
		const messages = await Promise.all([
			result.plain ? this.sendMessages(message, result.plain, 'plain') : null,
			result.reply ? this.sendMessages(message, result.reply, 'reply') : null,
			result.direct ? this.sendMessages(message, result.direct, 'direct') : null
		]);
		if(result.plain) result.normalMessages = messages[0];
		else if(result.reply) result.normalMessages = messages[1];
		if(result.direct) result.directMessages = messages[2];
	}

	async sendMessages(message, contents, type) {
		const sentMessages = [];
		for(const content of contents) {
			if(type === 'plain') sentMessages.push(await message.client.sendMessage(message, content));
			else if(type === 'reply') sentMessages.push(await message.reply(content));
			else if(type === 'direct') sentMessages.push(await message.client.sendMessage(message.author, content));
		}
		return sentMessages;
	}

	async updateMessagesForResult(message, result, oldResult) {
		// Update the messages
		const messages = await Promise.all([
			result.plain || result.reply ? this.updateMessages(message, oldResult.normalMessages, result.plain ? result.plain : result.reply, result.plain ? 'plain' : 'reply') : null,
			result.direct ? oldResult.direct ? this.updateMessages(message, oldResult.directMessages, result.direct, 'direct') : this.sendMessages(message, result.direct, 'direct') : null
		]);
		if(result.plain || result.reply) result.normalMessages = messages[0];
		if(result.direct) result.directMessages = messages[1];

		// Delete old messages if we're not using them
		if(!result.plain && !result.reply && (oldResult.plain || oldResult.reply)) for(const msg of oldResult.normalMessages) msg.delete();
		if(!result.direct && oldResult.direct) for(const msg of oldResult.directMessages) msg.delete();
	}

	async updateMessages(message, oldMessages, contents, type) {
		const updatedMessages = [];

		// Update/send messages
		for(let i = 0; i < contents.length; i++) {
			if(i < oldMessages.length) updatedMessages.push(await oldMessages[i].update(type === 'reply' ? `${message.author}, ${contents[i]}` : contents[i]));
			else updatedMessages.push((await this.sendMessages(message, [contents[i]], type))[0]);
		}

		// Delete extra old messages
		if(oldMessages.length > contents.length) {
			for(let i = oldMessages.length - 1; i >= contents.length; i--) oldMessages[i].delete();
		}

		return updatedMessages;
	}

	parseMessage(message) {
		// Find the command to run by patterns
		for(const command of this.registry.commands) {
			if(!command.patterns) continue;
			for(const pattern of command.patterns) {
				const matches = pattern.exec(message.content);
				if(matches) return [command, matches, true, true];
			}
		}

		// Find the command to run with default command handling
		const patternIndex = message.server ? message.server.id : '-';
		if(!this._serverCommandPatterns[patternIndex]) this._serverCommandPatterns[patternIndex] = this._buildCommandPattern(message.server, message.client.user);
		let [command, args, isCommandMessage] = this.matchDefault(message, this._serverCommandPatterns[patternIndex], 2);
		if(!command && !message.server) [command, args, isCommandMessage] = this.matchDefault(message, unprefixedCommandPattern);
		if(command) return [command, args, false, true];

		return [null, null, false, isCommandMessage];
	}

	matchDefault(message, pattern, commandNameIndex = 1) {
		const matches = pattern.exec(message.content);
		if(!matches) return [null, null, false];

		const commandName = matches[commandNameIndex].toLowerCase();
		const command = this.registry.commands.find(cmd => cmd.name === commandName || (cmd.aliases && cmd.aliases.some(alias => alias === commandName)));
		if(!command || command.disableDefault) return [null, null, true];

		const argString = message.content.substring(matches[1].length + (matches[2] ? matches[2].length : 0));
		let args;
		if(!('argsType' in command) || command.argsType === 'single') {
			args = [argString.trim()];
		} else if(command.argsType === 'multiple') {
			if('argsCount' in command) {
				if(command.argsCount < 2) throw new RangeError(`Command ${command.group}:${command.groupName} argsCount must be at least 2.`);
				args = [];
				const newlinesReplaced = argString.trim().replace(newlinesPattern, newlinesReplacement);
				const argv = stringArgv(newlinesReplaced);
				if(argv.length > 0) {
					for(let i = 0; i < command.argsCount - 1; i++) args.push(argv.shift());
					if(argv.length > 0) args.push(argv.join(' ').replace(newlinesReplacementPattern, '\n').replace(extraNewlinesPattern, '\n\n'));
				}
			} else {
				args = stringArgv(argString);
			}
		} else {
			throw new Error(`Command ${command.group}:${command.groupName} argsType is not one of 'single' or 'multiple'.`);
		}

		return [command, args, true];
	}

	static makeResultObject(result) {
		if(typeof result !== 'object' || Array.isArray(result)) result = { reply: result };
		if(result.plain && result.reply) throw new Error('The command result may contain either "plain" or "reply", not both.');
		if(result.plain && !Array.isArray(result.plain)) result.plain = [result.plain];
		if(result.reply && !Array.isArray(result.reply)) result.reply = [result.reply];
		if(result.direct && !Array.isArray(result.direct)) result.direct = [result.direct];
		if(!('editable' in result)) result.editable = true;
		return result;
	}

	/**
	 * Creates a regular expression to match the command prefix and name in a message
	 * @param {?Server} server - A Discord.js Server instance of the server that the message is from
	 * @param {User} user - The Discord.js User instance of the bot
	 * @return {RegExp} Regular expression that matches a command prefix and name
	 */
	_buildCommandPattern(server, user) {
		let prefix = server ? this.settings.getValue('command-prefix', this.config.commandPrefix, server) : this.config.commandPrefix;
		if(prefix === 'none') prefix = '';
		const escapedPrefix = escapeRegex(prefix);
		const prefixPatternPiece = prefix ? `${escapedPrefix}\\s*|` : '';
		const pattern = new RegExp(`^(${prefixPatternPiece}<@!?${user.id}>\\s+(?:${escapedPrefix})?)([^\\s]+)`, 'i');
		if(this.logger) {
			this.logger.info(`Server command pattern built.`, {
				server: server ? server.name : null,
				serverID: server ? server.id : null,
				prefix: prefix, pattern: pattern.source
			});
		}
		return pattern;
	}
}

const unprefixedCommandPattern = /^([^\s]+)/i;
const newlinesPattern = /\n/g;
const newlinesReplacement = '{!~NL~!}';
const newlinesReplacementPattern = new RegExp(newlinesReplacement, 'g');
const extraNewlinesPattern = /\n{3,}/g;
