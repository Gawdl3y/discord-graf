'use babel';
'use strict';

import ModRole from '../../database/mod-role';
import * as permissions from '../../permissions';
import CommandFormatError from '../../errors/command-format';
import Util from '../../util';

export default {
	name: 'addmodrole',
	aliases: ['addmod'],
	group: 'roles',
	groupName: 'add',
	description: 'Adds a moderator role.',
	usage: 'addmodrole <role>',
	details: 'The role must be the name or ID of a role, or a role mention. Only administrators may use this command.',
	examples: ['addmodrole cool', 'addmodrole 205536402341888001', 'addmodrole @CoolPeopleRole'],
	serverOnly: true,

	isRunnable(message) {
		return permissions.isAdmin(message.server, message.author);
	},

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.server);
		const matches = Util.patterns.roleID.exec(args[0]);
		let roles;
		const idRole = message.server.roles.get('id', matches[1]);
		if(idRole) roles = [idRole]; else roles = Util.search(message.server.roles, matches[1]);

		if(roles.length === 1) {
			if(ModRole.save(roles[0])) {
				return `Added "${roles[0].name}" to the moderator roles.`;
			} else {
				return `Unable to add "${roles[0].name}" to the moderator roles. It already is one.`;
			}
		} else if(roles.length > 1) {
			return Util.disambiguation(roles, 'roles');
		} else {
			return `Unable to identify role. Use ${Util.usage('roles', message.server)} to view all of the server roles.`;
		}
	}
};
