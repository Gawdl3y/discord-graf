'use babel';
'use strict';

import FriendlyError from './friendly';

/**
 * Has a descriptive message to send in a Discord reply
 */
export default class CommandFormatError extends FriendlyError {
	/**
	 * @param {Object} command - The command the error is for
	 * @param {?Server} server - The Discord.js Server the error is in
	 */
	constructor(command, server = null) {
		super(`Invalid command format. Use ${command.bot.util.usage(`help ${command.name}`, server)} for information.`);
		this.name = 'CommandFormatError';
	}
}
