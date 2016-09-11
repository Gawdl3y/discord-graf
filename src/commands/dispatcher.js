'use babel';
'use strict';

import EventEmitter from 'events';
import { stripIndents } from 'common-tags';
import escapeRegex from 'escape-string-regexp';
import Module from './module';
import FriendlyError from '../errors/friendly';

/** Handles parsing messages and running commands from them */
export default class CommandDispatcher extends EventEmitter {
	/** @param {Bot} bot - The bot the dispatcher is for */
	constructor(bot) {
		if(!bot) throw new Error('A bot must be specified.');
		super();

		/** @type {Bot} */
		this.bot = bot;

		this._guildCommandPatterns = {};
		this._results = new Map();
	}

	/**
	 * Handle a new message or a message update
	 * @param {Message} message - The message to handle
	 * @param {Message} [oldMessage] - The old message before the update
	 * @return {Promise<null>} No value
	 */
	async handleMessage(message, oldMessage = null) {
		if(message.author.bot) return null;
		else if(this.bot.config.values.selfbot && message.author.id !== this.bot.client.user.id) return null;
		else if(!this.bot.config.values.selfbot && message.author.id === this.bot.client.user.id) return null;

		// Make sure the edit actually changed the message content
		if(oldMessage && message.content === oldMessage.content) return null;

		// Make sure the bot is allowed to run in the channel, or the user is an admin
		if(!this.bot.config.values.selfbot && message.guild
			&& Module.isEnabled(this.bot.storage.settings, message.guild, 'channels')
			&& !this.bot.storage.allowedChannels.isEmpty(message.guild)
			&& !this.bot.storage.allowedChannels.exists(message.guild, message.channel.id)
			&& !this.bot.permissions.isAdmin(message.guild, message.author)) return null;

		// Parse the message, and get the old result if it exists
		const [command, args, fromPattern, isCommandMessage] = this._parseMessage(message);
		const oldResult = oldMessage ? this._results.get(oldMessage.id) : null;

		// Run the command, or make an error message result
		let result;
		if(command) {
			if(!command.isEnabled(message.guild)) result = { reply: [`The \`${command.name}\` command is disabled.`], editable: true };
			else if(!oldMessage || oldResult) result = await this.run(command, args, fromPattern, message);
		} else if(isCommandMessage) {
			result = { reply: [`Unknown command. Use ${this.bot.util.usage('help', message.guild)} to view the list of all commands.`], editable: true };
		} else if(this.bot.config.values.nonCommandEdit) {
			result = { editable: true };
		}

		return await this.handleMessageResult(message, result, oldResult);
	}

	/**
	 * Handle a message result
	 * @param {Message} message - The message the result is from
	 * @param {?CommandResult} result - The result
	 * @param {CommandResult} [oldResult] - The old result
	 * @return {Promise<null>} No value
	 */
	async handleMessageResult(message, result, oldResult = null) {
		if(result) {
			// Change a plain or reply response into direct if there isn't a guild
			if(!message.guild) {
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
			if(this.bot.config.values.commandEditable > 0) {
				if(result.editable) {
					result.timeout = oldResult && oldResult.timeout
						? oldResult.timeout
						: setTimeout(() => { this._results.delete(message.id); }, this.bot.config.values.commandEditable * 1000);
					this._results.set(message.id, result);
				} else {
					this._results.delete(message.id);
				}
			}
		}

		return null;
	}

	/**
	 * Run a command
	 * @param {Command} command - The command to run
	 * @param {string[]} args - The arguments for the command
	 * @param {boolean} fromPattern - Whether or not the arguments are from a pattern match
	 * @param {Message} message - The message that triggered the run
	 * @return {Promise<CommandResult>} The result of running the command
	 * @emits commandRun When a command is run, with the command, result, message, args, and fromPattern passed
	 * @emits commandError When an error occurs while running a command, with the command, message, args, and fromPattern passed
	 */
	async run(command, args, fromPattern, message) {
		const logInfo = {
			args: String(args),
			user: `${message.author.username}#${message.author.discriminator}`,
			userID: message.author.id,
			guild: message.guild ? message.guild.name : null,
			guildID: message.guild ? message.guild.id : null,
			messageID: message.id
		};

		// Make sure the command is usable
		if(command.guildOnly && !message.guild) {
			this.bot.logger.info(`Not running ${command.module}:${command.memberName}; guild only.`, logInfo);
			return { reply: [`The \`${command.name}\` command must be used in a server channel.`], editable: true };
		}
		if(!command.hasPermission(message.guild, message.author)) {
			this.bot.logger.info(`Not running ${command.module}:${command.memberName}; don't have permission.`, logInfo);
			return { reply: [`You do not have permission to use the \`${command.name}\` command.`], editable: true };
		}

		// Run the command
		this.bot.logger.info(`Running ${command.module}:${command.memberName}.`, logInfo);
		const typingCount = message.channel.typingCount;
		try {
			const result = this.constructor.makeResultObject(await command.run(message, args, fromPattern));
			this.emit('commandRun', command, result, message, args, fromPattern);
			return result;
		} catch(err) {
			this.emit('commandError', command, err, message, args, fromPattern);
			if(message.channel.typingCount > typingCount) message.channel.stopTyping();
			if(err instanceof FriendlyError) {
				return { reply: [err.message], editable: true };
			} else {
				this.bot.logger.error(err);
				const owner = this.bot.config.values.owner ? message.client.users.get(this.bot.config.values.owner) : null;
				return {
					reply: [stripIndents`
						An error occurred while running the command: \`${err.name}: ${err.message}\`
						You shouldn't ever receive an error like this.
						${owner ? `Please contact ${owner.username}#${owner.discriminator}${this.bot.config.values.invite ? ` in this server: ${this.bot.config.values.invite}` : '.'}` : ''}
					`],
					editable: true
				};
			}
		}
	}

	/**
	 * Sends messages for a command result
	 * @param {Message} message - The message the result is for
	 * @param {CommandResult} result - The command result
	 * @return {Promise<null>} No value
	 */
	async sendMessagesForResult(message, result) {
		const messages = await Promise.all([
			result.plain ? this.sendMessages(message, result.plain, 'plain') : null,
			result.reply ? this.sendMessages(message, result.reply, 'reply') : null,
			result.direct ? this.sendMessages(message, result.direct, 'direct') : null
		]);
		if(result.plain) result.normalMessages = messages[0];
		else if(result.reply) result.normalMessages = messages[1];
		if(result.direct) result.directMessages = messages[2];
		return null;
	}

	/**
	 * Sends messages
	 * @param {Message} message - The message the messages are being sent in response to
	 * @param {string[]} contents - Contents of the messages to send
	 * @param {string} type - One of 'plain', 'reply', or 'direct'
	 * @return {Promise<Message[]>} The sent messages
	 */
	async sendMessages(message, contents, type) {
		const sentMessages = [];
		for(const content of contents) {
			if(type === 'plain') sentMessages.push(await message.channel.sendMessage(content));
			else if(type === 'reply') sentMessages.push(await message.reply(content));
			else if(type === 'direct') sentMessages.push(await message.author.sendMessage(content));
		}
		return sentMessages;
	}

	/**
	 * Updates messages for a command result
	 * @param {Message} message - The message the result is for
	 * @param {CommandResult} result - The command result
	 * @param {CommandResult} oldResult - The old command result
	 * @return {Promise<null>} No value
	 */
	async updateMessagesForResult(message, result, oldResult) {
		// Update the messages
		const messages = await Promise.all([
			result.plain || result.reply ? this.updateMessages(message, oldResult.normalMessages, result.plain || result.reply, result.plain ? 'plain' : 'reply') : null,
			result.direct ? oldResult.direct ? this.updateMessages(message, oldResult.directMessages, result.direct, 'direct') : this.sendMessages(message, result.direct, 'direct') : null
		]);
		if(result.plain || result.reply) result.normalMessages = messages[0];
		if(result.direct) result.directMessages = messages[1];

		// Delete old messages if we're not using them
		if(!result.plain && !result.reply && (oldResult.plain || oldResult.reply)) for(const msg of oldResult.normalMessages) msg.delete();
		if(!result.direct && oldResult.direct) for(const msg of oldResult.directMessages) msg.delete();

		return null;
	}

	/**
	 * Updates messages
	 * @param {Message} message - The message the old messages are being updated in response to
	 * @param {Message[]} oldMessages - The old messages to update
	 * @param {string[]} contents - Contents of the messages to send
	 * @param {string} type - One of 'plain', 'reply', or 'direct'
	 * @return {Promise<Message[]>} The updated messages
	 */
	async updateMessages(message, oldMessages, contents, type) {
		const updatedMessages = [];

		// Update/send messages
		for(let i = 0; i < contents.length; i++) {
			if(i < oldMessages.length) updatedMessages.push(await oldMessages[i].edit(type === 'reply' ? `${message.author}, ${contents[i]}` : contents[i]));
			else updatedMessages.push((await this.sendMessages(message, [contents[i]], type))[0]);
		}

		// Delete extra old messages
		if(oldMessages.length > contents.length) {
			for(let i = oldMessages.length - 1; i >= contents.length; i--) oldMessages[i].delete();
		}

		return updatedMessages;
	}

	/**
	 * Parses a message to find details about command usage in it
	 * @param {Message} message - The message
	 * @return {Array} Command, arguments, whether or not it's from a pattern match, and whether or not it's a command message
	 */
	_parseMessage(message) {
		// Find the command to run by patterns
		for(const command of this.bot.registry.commands) {
			if(!command.patterns) continue;
			for(const pattern of command.patterns) {
				const matches = pattern.exec(message.content);
				if(matches) return [command, matches, true, true];
			}
		}

		// Find the command to run with default command handling
		const patternIndex = message.guild ? message.guild.id : '-';
		if(!this._guildCommandPatterns[patternIndex]) this._guildCommandPatterns[patternIndex] = this._buildCommandPattern(message.guild, message.client.user);
		let [command, args, isCommandMessage] = this._matchDefault(message, this._guildCommandPatterns[patternIndex], 2);
		if(!command && !message.guild && !this.bot.config.values.selfbot) [command, args, isCommandMessage] = this._matchDefault(message, /^([^\s]+)/i);
		if(command) return [command, args, false, true];

		return [null, null, false, isCommandMessage];
	}

	/**
	 * Matches a message against a guild command pattern
	 * @param {Message} message - The message
	 * @param {RegExp} pattern - The pattern to match against
	 * @param {number} commandNameIndex - The index of the command name in the pattern matches
	 * @return {Array} The command, arguments, and whether or not it's a command message
	 */
	_matchDefault(message, pattern, commandNameIndex = 1) {
		const matches = pattern.exec(message.content);
		if(!matches) return [null, null, false];

		const commands = this.bot.registry.findCommands(matches[commandNameIndex]);
		if(commands.length !== 1) return [null, null, true];
		if(!commands[0] || !commands[0].defaultHandling) return [null, null, true];

		const argString = message.content.substring(matches[1].length + (matches[2] ? matches[2].length : 0));
		let args;
		if(commands[0].argsType === 'single') {
			args = [argString.trim()];
		} else if(commands[0].argsType === 'multiple') {
			args = this.constructor.parseArgs(argString, commands[0].argsCount, commands[0].argsSingleQuotes);
		}

		return [commands[0], args, true];
	}

	/**
	 * Makes a command result object from a command's run result
	 * @param {CommandResult|string[]|string} result - The command's run result
	 * @return {CommandResult} The result object
	 */
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
	 * Parses an argument string into an array of arguments
	 * @param {string} argString - The argument string to parse
	 * @param {number} [argCount] - The number of arguments to extract from the string
	 * @param {boolean} [allowSingleQuote=true] - Whether or not single quotes should be allowed to wrap arguments, in addition to double quotes
	 * @return {string[]} The array of arguments
	 */
	static parseArgs(argString, argCount, allowSingleQuote = true) {
		const re = allowSingleQuote ? /\s*(?:("|')([^]*?)\1|(\S+))\s*/g : /\s*(?:(")([^]*?)"|(\S+))\s*/g;
		const result = [];
		let match = [];
		// default: large enough to get all items
		argCount = argCount || argString.length;
		// get match and push the capture group that is not null to the result
		while(--argCount && (match = re.exec(argString))) result.push(match[2] || match[3]);
		// if text remains, push it to the array as it is, except for wrapping quotes, which are removed from it
		if(match && re.lastIndex < argString.length) {
			const re2 = allowSingleQuote ? /^("|')([^]*)\1$/g : /^(")([^]*)"$/g;
			result.push(argString.substr(re.lastIndex).replace(re2, '$2'));
		}
		return result;
	}

	/**
	 * Creates a regular expression to match the command prefix and name in a message
	 * @param {?Guild} guild - The Guild that the message is from
	 * @param {User} user - The User that the bot is running for
	 * @return {RegExp} Regular expression that matches a command prefix and name
	 */
	_buildCommandPattern(guild, user) {
		let prefix = guild ? this.bot.storage.settings.getValue(guild, 'command-prefix', this.bot.config.values.commandPrefix) : this.bot.config.values.commandPrefix;
		if(prefix === 'none') prefix = '';
		const escapedPrefix = escapeRegex(prefix);
		const prefixPatternPiece = prefix ? `${escapedPrefix}\\s*|` : '';
		const pattern = new RegExp(`^(${prefixPatternPiece}<@!?${user.id}>\\s+(?:${escapedPrefix})?)([^\\s]+)`, 'i');
		this.bot.logger.verbose(`Guild command pattern built.`, {
			guild: guild ? guild.name : null,
			guildID: guild ? guild.id : null,
			prefix: prefix, pattern: pattern.source
		});
		return pattern;
	}
}

/**
 * @typedef {Object} CommandResult
 * @property {string[]} [plain] - Strings to send plain messages for
 * @property {string[]} [reply] - Strings to send reply messages for
 * @property {string[]} [direct] - Strings to send direct messages for
 * @property {boolean} [editable=true] - Whether or not the command message is editable
 */
