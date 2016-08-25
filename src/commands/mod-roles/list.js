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
			guildOnly: true
		});
	}

	hasPermission(guild, user) {
		return this.bot.permissions.isAdmin(guild, user);
	}

	async run(message) {
		const roles = this.bot.storage.modRoles.find(message.guild);
		if(roles.length > 0) {
			return stripIndents`
				__**Moderator roles**__
				${roles.map(role => `**-** ${role ? `${role.name} (ID: ${role.id})` : role}`).join('\n')}
			`;
		} else {
			return 'There are no moderator roles, therefore moderators are determined by the "Manage messages" permission.';
		}
	}
}
