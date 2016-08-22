'use babel';
'use strict';

import { stripIndents } from 'common-tags';
import Command from '../command';

export default class ListModRolesCommand extends Command {
	constructor(bot) {
		super(bot);
		this.name = 'modroles';
		this.aliases = ['listmodroles', 'mods'];
		this.module = 'mod-roles';
		this.memberName = 'list';
		this.description = 'Lists all moderator roles.';
		this.details = 'Only administrators may use this command.';
		this.serverOnly = true;
	}

	hasPermission(server, user) {
		return this.bot.permissions.isAdmin(server, user);
	}

	async run(message) {
		const roles = this.bot.storage.modRoles.find(message.server);
		if(roles.length > 0) {
			return stripIndents`
				__**Moderator roles:**__
				${roles.map(role => `**-** ${role.name} (ID: ${role.id})`).join('\n')}
			`;
		} else {
			return 'There are no moderator roles, therefore moderators are determined by the "Manage messages" permission.';
		}
	}
}
