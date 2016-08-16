'use babel';
'use strict';

import { stripIndents } from 'common-tags';
import Command from '../command';

export default class ListRolesCommand extends Command {
	constructor(bot) {
		super(bot);
		this.name = 'roles';
		this.aliases = ['listroles'];
		this.group = 'roles';
		this.groupName = 'list';
		this.description = 'Lists all server roles.';
		this.details = 'Only administrators may use this command.';
		this.serverOnly = true;
	}

	isRunnable(message) {
		return this.bot.permissions.isAdmin(message.server, message.author);
	}

	async run(message) {
		return stripIndents`
			__**Server roles:**__
			${message.server.roles.map(role => `**-** ${role.name} (ID: ${role.id})`).join('\n')}
		`;
	}
}
