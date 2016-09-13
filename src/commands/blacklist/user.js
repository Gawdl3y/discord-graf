'use babel';
'use strict';

import Command from '../command';
import CommandFormatError from '../../errors/command-format';
import Setting from '../../storage/models/setting';

export default class BlacklistUserCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'blacklist-user',
			module: 'blacklist',
			memberName: 'user',
			description: 'Toggles blacklisting of a user.',
			usage: 'blacklist-user <user>',
			details: 'The user must be a user ID or mention. Only the bot owner may use this command.',
			examples: ['blacklist-user @SomeUser#1234', 'blacklist-user 139472743439398254']
		});
	}

	hasPermission(guild, user) {
		return this.bot.permissions.isOwner(user);
	}

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.guild);
		const matches = this.bot.util.patterns.userID.exec(args[0]);
		const user = matches ? matches[1] : null;
		if(!user) return `Unable to identify user.`;

		let users = this.bot.storage.settings.getValue(null, 'blacklisted-users');
		if(!users) {
			this.bot.storage.settings.save(new Setting(null, 'blacklisted-users', []));
			users = this.bot.storage.settings.getValue(null, 'blacklisted-users');
		}

		const index = users.indexOf(user);
		if(index >= 0) {
			users.splice(index, 1);
			this.bot.storage.settings.saveStorage();
			return `Unblacklisted user ${user}.`;
		} else {
			users.push(user);
			this.bot.storage.settings.saveStorage();
			return `Blacklisted user ${user}.`;
		}
	}
}
