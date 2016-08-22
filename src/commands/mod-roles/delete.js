'use babel';
'use strict';

import { stripIndents, oneLine } from 'common-tags';
import Command from '../command';
import CommandFormatError from '../../errors/command-format';

export default class DeleteModRoleCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'deletemodrole',
			aliases: ['removemodrole', 'delmodrole', 'removemod', 'deletemod', 'delmod'],
			module: 'mod-roles',
			memberName: 'delete',
			description: 'Deletes a moderator role.',
			usage: 'deletemodrole <role>',
			details: 'The role must be the name or ID of a role, or a role mention. Only administrators may use this command.',
			examples: ['deletemodrole cool', 'deletemodrole 205536402341888001', 'deletemodrole @CoolPeopleRole'],
			serverOnly: true
		});
	}

	hasPermission(server, user) {
		return this.bot.permissions.isAdmin(server, user);
	}

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.server);
		const matches = this.bot.util.patterns.roleID.exec(args[0]);
		const idRole = matches ? message.server.roles.get('id', matches[1]) : null;
		const roles = idRole ? [idRole] : this.bot.storage.modRoles.find(message.server, args[0]);

		if(roles.length === 1) {
			if(this.bot.storage.modRoles.delete(roles[0])) {
				return stripIndents`
					Removed "${roles[0].name}" from the moderator roles.
					${this.bot.storage.modRoles.find(message.server).length === 0
						? 'Since there are no longer any moderator roles, moderators will be determined by the "Manage messages" permission.'
					: ''}
				`;
			} else {
				return `Unable to remove "${roles[0].name}" from the moderator roles. It isn\'t one.`;
			}
		} else if(roles.length > 1) {
			return this.bot.util.disambiguation(roles, 'roles');
		} else {
			return oneLine`
				Unable to identify role.
				Use ${this.bot.util.usage('modroles', message.server)} to view the moderator roles,
				and ${this.bot.util.usage('roles', message.server)} to view all of the server roles.
			`;
		}
	}
}
