'use babel';
'use strict';

import Command from '../command';

export default class ClearAllowedChannelsCommand extends Command {
	constructor(bot) {
		super(bot);
		this.name = 'clearallowedchannels';
		this.aliases = ['clearallowedchans', 'clearchannels', 'clearchans'];
		this.module = 'channels';
		this.memberName = 'clear-allowed';
		this.description = 'Clears all of the allowed channels.';
		this.details = 'Only administrators may use this command.';
		this.serverOnly = true;

		this.lastUser = null;
		this.timeout = null;
	}

	isRunnable(message) {
		return this.bot.permissions.isAdmin(message.server, message.author);
	}

	async run(message, args) {
		if(message.author.equals(this.lastUser) && args[0] && args[0].toLowerCase() === 'confirm') {
			this.bot.storage.allowedChannels.clear(message.server);
			clearTimeout(this.timeout);
			this.lastUser = null;
			this.timeout = null;
			return 'Cleared the server\'s allowed channels. Operation is now allowed in all channels.';
		} else {
			if(this.timeout) {
				clearTimeout(this.timeout);
				this.timeout = null;
			}
			this.lastUser = message.author;
			this.timeout = setTimeout(() => { this.lastUser = null; }, 30000);
			return `Are you sure you want to clear all of the allowed channels? Operation will be permitted in all channels. Use ${this.bot.util.usage('clearallowedchannels confirm', message.server)} to continue.`;
		}
	}
}
