'use babel';
'use strict';

import Storage from './storage';
import Util from '../util';

export default class ModRoleStorage extends Storage {
	constructor(localStorage, logger) {
		super('mod-roles', localStorage, logger);
	}

	save(role) {
		return super.save(role.server, role.id);
	}

	delete(role) {
		return super.delete(role.server, role.id);
	}

	find(server, searchString = null) {
		if(!server) throw new Error('A server must be specified.');
		if(!this.serversMap) this.loadStorage();
		if(!this.serversMap[server.id]) return [];

		// Find all of the server's roles that match, and filter them to ones that are mod roles
		const roles = Util.search(server.roles, searchString, { searchExact: false }).filter(role => this.serversMap[server.id].includes(role.id));
		return Util.search(roles, searchString, { searchInexact: false });
	}
}
