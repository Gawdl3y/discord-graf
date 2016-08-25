'use babel';
'use strict';

import { stripIndents } from 'common-tags';
import Command from '../command';
import CommandFormatError from '../../errors/command-format';

export default class DeleteModRoleCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'delete-mod-role',
			aliases: ['remove-mod-role', 'del-mod-role'],
			module: 'mod-roles',
			memberName: 'delete',
			description: 'Deletes a moderator role.',
			usage: 'delete-mod-role <role>',
			details: 'The role must be the name or ID of a role, or a role mention. Only administrators may use this command.',
			examples: ['delete-mod-role cool', 'delete-mod-role 205536402341888001', 'delete-mod-role @CoolPeopleRole'],
			guildOnly: true
		});
	}

	hasPermission(guild, user) {
		return this.bot.permissions.isAdmin(guild, user);
	}

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.guild);
		const matches = this.bot.util.patterns.roleID.exec(args[0]);
		const idRole = matches ? message.guild.roles.get(matches[1]) : null;
		const roles = idRole ? [idRole] : this.bot.storage.modRoles.find(message.guild, args[0]);

		if(roles.length === 1) {
			if(this.bot.storage.modRoles.delete(roles[0])) {
				return stripIndents`
					Removed "${roles[0].name}" from the moderator roles.
					${this.bot.storage.modRoles.find(message.guild).length === 0
						? 'Since there are no longer any moderator roles, moderators will be determined by the "Manage messages" permission.'
					: ''}
				`;
			} else {
				return `Unable to remove "${roles[0].name}" from the moderator roles. It isn\'t one.`;
			}
		} else if(roles.length > 1) {
			return this.bot.util.disambiguation(roles, 'roles');
		} else {
			return `Unable to identify role. Use ${this.bot.util.usage('mod-roles', message.guild)} to view the moderator roles.`;
		}
	}
}
