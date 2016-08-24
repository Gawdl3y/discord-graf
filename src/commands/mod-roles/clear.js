'use babel';
'use strict';

import Command from '../command';

export default class ClearModRolesCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'clear-mod-roles',
			module: 'mod-roles',
			memberName: 'clear',
			description: 'Clears all of the moderator roles.',
			details: 'Only administrators may use this command.',
			serverOnly: true
		});

		this.lastUser = null;
		this.timeout = null;
	}

	hasPermission(server, user) {
		return this.bot.permissions.isAdmin(server, user);
	}

	async run(message, args) {
		if(message.author.equals(this.lastUser) && args[0] && args[0].toLowerCase() === 'confirm') {
			this.bot.storage.clear(message.channel.server);
			clearTimeout(this.timeout);
			this.lastUser = null;
			this.timeout = null;
			return 'Cleared the server\'s moderator roles. Moderators will be determined by the "Manage messages" permission.';
		} else {
			if(this.timeout) {
				clearTimeout(this.timeout);
				this.timeout = null;
			}
			this.lastUser = message.author;
			this.timeout = setTimeout(() => { this.lastUser = null; }, 30000);
			return `Are you sure you want to clear all of the moderator roles? Use ${this.bot.util.usage('clearmodroles confirm', message.channel.server)} within the next 30 seconds to continue.`;
		}
	}
}
