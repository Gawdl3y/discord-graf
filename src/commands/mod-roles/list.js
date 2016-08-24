'use babel';
'use strict';

import { stripIndents } from 'common-tags';
import Command from '../command';

export default class ListModRolesCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'mod-roles',
			aliases: ['list-mod-roles', 'show-mod-roles'],
			module: 'mod-roles',
			memberName: 'list',
			description: 'Lists all moderator roles.',
			details: 'Only administrators may use this command.',
			serverOnly: true
		});
	}

	hasPermission(server, user) {
		return this.bot.permissions.isAdmin(server, user);
	}

	async run(message) {
		const roles = this.bot.storage.modRoles.find(message.channel.server);
		if(roles.length > 0) {
			return stripIndents`
				__**Moderator roles**__
				${roles.map(role => `**-** ${role.name} (ID: ${role.id})`).join('\n')}
			`;
		} else {
			return 'There are no moderator roles, therefore moderators are determined by the "Manage messages" permission.';
		}
	}
}
