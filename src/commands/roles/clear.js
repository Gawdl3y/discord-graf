'use babel';
'use strict';

import ModRole from '../../database/mod-role';
import * as permissions from '../../permissions';
import Util from '../../util';

let lastUser;
let timeout;

export default {
	name: 'clearmodroles',
	aliases: ['clearmods'],
	group: 'roles',
	groupName: 'clear',
	description: 'Clears all of the moderator roles.',
	details: 'Only administrators may use this command.',
	serverOnly: true,

	isRunnable(message) {
		return permissions.isAdmin(message.server, message.author);
	},

	async run(message, args) {
		if(message.author.equals(lastUser) && args[0] && args[0].toLowerCase() === 'confirm') {
			ModRole.clearServer(message.server);
			clearTimeout(timeout);
			lastUser = null;
			timeout = null;
			return 'Cleared the server\'s moderator roles. Moderators will be determined by the "Manage messages" permission.';
		} else {
			if(timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			lastUser = message.author;
			timeout = setTimeout(() => { lastUser = null; }, 30000);
			return `Are you sure you want to clear all of the moderator roles? Use ${Util.usage('clearmodroles confirm', message.server)} within the next 30 seconds to continue.`;
		}
	}
};
