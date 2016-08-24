'use babel';
'use strict';

import { oneLine } from 'common-tags';
import Command from '../command';

export default class ClearAllowedChannelsCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'clear-allowed-channels',
			aliases: ['clear-allowed-chans'],
			module: 'channels',
			memberName: 'clear-allowed',
			description: 'Clears all of the allowed channels.',
			details: 'Only administrators may use this command.',
			guildOnly: true
		});

		this.lastUser = null;
		this.timeout = null;
	}

	hasPermission(guild, user) {
		return this.bot.permissions.isAdmin(guild, user);
	}

	async run(message, args) {
		if(message.author.equals(this.lastUser) && args[0] && args[0].toLowerCase() === 'confirm') {
			this.bot.storage.allowedChannels.clear(message.guild);
			clearTimeout(this.timeout);
			this.lastUser = null;
			this.timeout = null;
			return 'Cleared the guild\'s allowed channels. Operation is now allowed in all channels.';
		} else {
			if(this.timeout) {
				clearTimeout(this.timeout);
				this.timeout = null;
			}
			this.lastUser = message.author;
			this.timeout = setTimeout(() => { this.lastUser = null; }, 30000);
			return oneLine`
				Are you sure you want to clear all of the allowed channels?
				Operation will be permitted in all channels.
				Use ${this.bot.util.usage('clearallowedchannels confirm', message.guild)} to continue.
			`;
		}
	}
}
