'use babel';
'use strict';

import Storage from './storage';
import Util from '../bot/util';

export default class ModRoleStorage extends Storage {
	constructor(localStorage, logger) {
		super('mod-roles', localStorage, logger);
	}

	save(role) {
		return super.save(role.guild, role.id);
	}

	delete(role) {
		return super.delete(role.guild, role.id);
	}

	find(guild, searchString = null) {
		if(!guild) throw new Error('A guild must be specified.');
		if(!this.guildsMap) this.loadStorage();
		if(!this.guildsMap[guild.id]) return [];

		// Find all of the guild's roles that match, and filter them to ones that are mod roles
		const roles = Util.search(guild.roles, searchString, { searchExact: false }).filter(role => this.guildsMap[guild.id].includes(role.id));
		return Util.search(roles, searchString, { searchInexact: false });
	}
}
