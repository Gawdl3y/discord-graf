'use babel';
'use strict';

import Command from '../command';
import CommandFormatError from '../../errors/command-format';

export default class AddModRoleCommand extends Command {
	constructor(bot) {
		super(bot);
		this.name = 'addmodrole';
		this.aliases = ['addmod'];
		this.group = 'roles';
		this.groupName = 'add-mod';
		this.description = 'Adds a moderator role.';
		this.usage = 'addmodrole <role>';
		this.details = 'The role must be the name or ID of a role, or a role mention. Only administrators may use this command.';
		this.examples = ['addmodrole cool', 'addmodrole 205536402341888001', 'addmodrole @CoolPeopleRole'];
		this.serverOnly = true;
	}

	isRunnable(message) {
		return this.bot.permissions.isAdmin(message.server, message.author);
	}

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.server);
		const matches = this.bot.util.patterns.roleID.exec(args[0]);
		let roles;
		const idRole = message.server.roles.get('id', matches[1]);
		if(idRole) roles = [idRole]; else roles = this.bot.util.search(message.server.roles, matches[1]);

		if(roles.length === 1) {
			if(this.bot.storage.modRoles.save(roles[0])) {
				return `Added "${roles[0].name}" to the moderator roles.`;
			} else {
				return `Unable to add "${roles[0].name}" to the moderator roles. It already is one.`;
			}
		} else if(roles.length > 1) {
			return this.bot.util.disambiguation(roles, 'roles');
		} else {
			return `Unable to identify role. Use ${this.bot.util.usage('roles', message.server)} to view all of the server roles.`;
		}
	}
}
