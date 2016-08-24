'use babel';
'use strict';

import FriendlyError from './friendly';

/** Has a descriptive message for a command not having proper format */
export default class CommandFormatError extends FriendlyError {
	/**
	 * @param {Command} command - The command the error is for
	 * @param {?Guild} guild - The Guild the error is in
	 */
	constructor(command, guild = null) {
		super(`Invalid command format. Use ${command.bot.util.usage(`help ${command.name}`, guild)} for information.`);
		/** @ignore */
		this.name = 'CommandFormatError';
	}
}
