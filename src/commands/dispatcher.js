'use babel';
'use strict';

import stringArgv from 'string-argv';
import { stripIndents } from 'common-tags';
import bot from '..';
import * as registry from './registry';
import config from '../config';
import UsableChannel from '../database/usable-channel';
import * as permissions from '../util/permissions';
import buildCommandPattern from '../util/command-pattern';
import usage from '../util/command-usage';
import FriendlyError from '../util/errors/friendly';

export const serverCommandPatterns = {};
export const unprefixedCommandPattern = /^([^\s]+)/i;
export const commandResults = {};

// Handle a raw message
export async function handleMessage(message, oldMessage = null) {
	// Make sure the bot is allowed to run in the channel, or the user is an admin
	if(message.server && UsableChannel.serverHasAny(message.server)
		&& !UsableChannel.serverHas(message.server, message.channel)
		&& !permissions.isAdmin(message.server, message.author)) return;

	// Parse the message, and get the old result if it exists
	const [command, args, fromPattern, isCommandMessage] = parseMessage(message);
	const oldResult = oldMessage ? commandResults[oldMessage.id] : null;

	// Run the command, or make an error message result
	let result;
	if(command) {
		if(!oldMessage || oldResult) result = makeResultObject(await run(command, args, fromPattern, message));
	} else if(isCommandMessage) {
		result = { reply: [`Unknown command. Use ${usage('help', message.server)} to view the list of all commands.`], editable: true };
	} else if(config.nonCommandEdit) {
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
			await updateMessagesForResult(message, result, oldResult);
		} else {
			await sendMessagesForResult(message, result);
		}

		// Cache the result
		if(config.commandEditable > 0) {
			if(result.editable) {
				result.timeout = oldResult && oldResult.timeout ? oldResult.timeout : setTimeout(() => { delete commandResults[message.id]; }, config.commandEditable * 1000);
				commandResults[message.id] = result;
			} else {
				delete commandResults[message.id];
			}
		}
	}
}

// Run a command
export async function run(command, args, fromPattern, message) {
	const logInfo = {
		args: String(args),
		user: `${message.author.username}#${message.author.discriminator}`,
		userID: message.author.id,
		server: message.server ? message.server.name : null,
		serverID: message.server ? message.server.id : null
	};

	// Make sure the command is usable
	if(command.serverOnly && !message.server) {
		bot.logger.info(`Not running ${command.group}:${command.groupName}; server only.`, logInfo);
		return `The \`${command.name}\` command must be used in a server channel.`;
	}
	if(command.isRunnable && !command.isRunnable(message)) {
		bot.logger.info(`Not running ${command.group}:${command.groupName}; not runnable.`, logInfo);
		return `You do not have permission to use the \`${command.name}\` command.`;
	}

	// Run the command
	bot.logger.info(`Running ${command.group}:${command.groupName}.`, logInfo);
	try {
		return await command.run(message, args, fromPattern);
	} catch(err) {
		if(err instanceof FriendlyError) {
			return err.message;
		} else {
			bot.logger.error(err);
			const owner = config.owner ? message.client.users.get('id', config.owner) : null;
			return stripIndents`
				An error occurred while running the command: \`${err.name}: ${err.message}\`
				${owner ? `Please contact ${owner.name}#${owner.discriminator}${config.invite ? ` in this server: ${config.invite}` : '.'}` : ''}
			`;
		}
	}
}

// Get a result object from running a command
export function makeResultObject(result) {
	if(typeof result !== 'object' || Array.isArray(result)) result = { reply: result };
	if(!('editable' in result)) result.editable = true;
	if(result.plain && result.reply) throw new Error('The command result may contain either "plain" or "reply", not both.');
	if(result.plain && !Array.isArray(result.plain)) result.plain = [result.plain];
	if(result.reply && !Array.isArray(result.reply)) result.reply = [result.reply];
	if(result.direct && !Array.isArray(result.direct)) result.direct = [result.direct];
	return result;
}

// Send messages for a result object
export async function sendMessagesForResult(message, result) {
	const messages = await Promise.all([
		result.plain ? sendMessages(message, result.plain, 'plain') : null,
		result.reply ? sendMessages(message, result.reply, 'reply') : null,
		result.direct ? sendMessages(message, result.direct, 'direct') : null
	]);
	if(result.plain) result.normalMessages = messages[0];
	else if(result.reply) result.normalMessages = messages[1];
	if(result.direct) result.directMessages = messages[2];
}

// Send messages in response to a message
export async function sendMessages(message, contents, type) {
	const sentMessages = [];
	for(const content of contents) {
		if(type === 'plain') sentMessages.push(await message.client.sendMessage(message, content));
		else if(type === 'reply') sentMessages.push(await message.reply(content));
		else if(type === 'direct') sentMessages.push(await message.client.sendMessage(message.author, content));
	}
	return sentMessages;
}

// Update old messages to reflect a new result
export async function updateMessagesForResult(message, result, oldResult) {
	// Update the messages
	const messages = await Promise.all([
		result.plain || result.reply ? updateMessages(message, oldResult.normalMessages, result.plain ? result.plain : result.reply, result.plain ? 'plain' : 'reply') : null,
		result.direct ? oldResult.direct ? updateMessages(message, oldResult.directMessages, result.direct, 'direct') : sendMessages(message, result.direct, 'direct') : null
	]);
	if(result.plain || result.reply) result.normalMessages = messages[0];
	if(result.direct) result.directMessages = messages[1];

	// Delete old messages if we're not using them
	if(!result.plain && !result.reply && (oldResult.plain || oldResult.reply)) for(const msg of oldResult.normalMessages) msg.delete();
	if(!result.direct && oldResult.direct) for(const msg of oldResult.directMessages) msg.delete();
}

// Update messages in response to a message
export async function updateMessages(message, oldMessages, contents, type) {
	const updatedMessages = [];

	// Update/send messages
	for(let i = 0; i < contents.length; i++) {
		if(i < oldMessages.length) updatedMessages.push(await oldMessages[i].update(type === 'reply' ? `${message.author}, ${contents[i]}` : contents[i]));
		else updatedMessages.push((await sendMessages(message, [contents[i]], type))[0]);
	}

	// Delete extra old messages
	if(oldMessages.length > contents.length) {
		for(let i = oldMessages.length - 1; i >= contents.length; i--) oldMessages[i].delete();
	}

	return updatedMessages;
}

// Get an array of metadata for a command in a message
export function parseMessage(message) {
	// Find the command to run by patterns
	for(const command of registry.commands) {
		if(!command.patterns) continue;
		for(const pattern of command.patterns) {
			const matches = pattern.exec(message.content);
			if(matches) return [command, matches, true, true];
		}
	}

	// Find the command to run with default command handling
	const patternIndex = message.server ? message.server.id : '-';
	if(!serverCommandPatterns[patternIndex]) serverCommandPatterns[patternIndex] = buildCommandPattern(message.server, message.client.user);
	let [command, args, isCommandMessage] = matchDefault(message, serverCommandPatterns[patternIndex], 2);
	if(!command && !message.server) [command, args, isCommandMessage] = matchDefault(message, unprefixedCommandPattern);
	if(command) return [command, args, false, true];

	return [null, null, false, isCommandMessage];
}

// Find the command and arguments from a default matches pattern
const newlinesPattern = /\n/g;
const newlinesReplacement = '{!~NL~!}';
const newlinesReplacementPattern = new RegExp(newlinesReplacement, 'g');
const extraNewlinesPattern = /\n{3,}/g;
export function matchDefault(message, pattern, commandNameIndex = 1) {
	const matches = pattern.exec(message.content);
	if(!matches) return [null, null, false];

	const commandName = matches[commandNameIndex].toLowerCase();
	const command = registry.commands.find(cmd => cmd.name === commandName || (cmd.aliases && cmd.aliases.some(alias => alias === commandName)));
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
