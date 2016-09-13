'use babel';
'use strict';

import { stripIndents } from 'common-tags';
import Command from '../command';

export default class ShowBlacklistCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'blacklist',
			module: 'blacklist',
			memberName: 'show',
			description: 'Lists all blacklisted users and servers.',
			details: 'Only the bot owner may use this command.'
		});
	}

	hasPermission(guild, user) {
		return this.bot.permissions.isOwner(user);
	}

	async run() {
		const users = this.bot.storage.settings.getValue(null, 'blacklisted-users', []);
		const guilds = this.bot.storage.settings.getValue(null, 'blacklisted-guilds', []);
		return this.bot.util.split(stripIndents`**Blacklist:**
			__Users__
			${users.map(user => `**-** ${user}`).join('')}

			__Servers__
			${guilds.map(guild => `**-** ${guild}`).join('')}
		`);
	}
}
