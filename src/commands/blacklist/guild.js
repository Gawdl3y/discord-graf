'use babel';
'use strict';

import Command from '../command';
import CommandFormatError from '../../errors/command-format';
import Setting from '../../storage/models/setting';

export default class BlacklistGuildCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'blacklist-server',
			aliases: ['blacklist-guild'],
			module: 'blacklist',
			memberName: 'server',
			description: 'Toggles blacklisting of a server.',
			usage: 'blacklist-server <server>',
			details: 'The server must be a server ID. Only the bot owner may use this command.',
			examples: ['blacklist-server 139472743439398254']
		});
	}

	hasPermission(guild, user) {
		return this.bot.permissions.isOwner(user);
	}

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.guild);

		let guilds = this.bot.storage.settings.getValue(null, 'blacklisted-guilds');
		if(!guilds) {
			this.bot.storage.settings.save(new Setting(null, 'blacklisted-guilds', []));
			guilds = this.bot.storage.settings.getValue(null, 'blacklisted-guilds');
		}

		const index = guilds.indexOf(args[0]);
		if(index >= 0) {
			guilds.splice(index, 1);
			this.bot.storage.settings.saveStorage();
			if(message.client.guilds.has(args[0])) message.client.guilds.get(args[0]).leave();
			return `Unblacklisted server ${args[0]}.`;
		} else {
			guilds.push(args[0]);
			this.bot.storage.settings.saveStorage();
			return `Blacklisted server ${args[0]}.`;
		}
	}
}
