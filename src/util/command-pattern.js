'use babel';
'use strict';

import escapeRegex from 'escape-string-regexp';
import bot from '../';
import config from '../config';
import Setting from '../database/setting';

/**
 * Creates a regular expression to match the command prefix and name in a message
 * @param {Server|null} server - A Discord.js Server instance of the server that the message is from
 * @param {User} user - The Discord.js User instance of the bot
 * @returns {RegExp} Regular expression that matches a command prefix and name
 */
export function buildCommandPattern(server, user) {
	let prefix = server ? Setting.getValue('command-prefix', config.commandPrefix, server) : config.commandPrefix;
	if(prefix === 'none') prefix = '';
	const escapedPrefix = escapeRegex(prefix);
	const prefixPatternPiece = prefix ? `${escapedPrefix}\\s*|` : '';
	const pattern = new RegExp(`^(${prefixPatternPiece}<@!?${user.id}>\\s+(?:${escapedPrefix})?)([^\\s]+)`, 'i');
	bot.logger.info(`Server command pattern built.`, { server: server ? server.name : null, serverID: server ? server.id : null, prefix: prefix, pattern: pattern.source });
	return pattern;
}
export default buildCommandPattern;
