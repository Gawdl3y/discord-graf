'use babel';
'use strict';

import { stripIndents } from 'common-tags';
import Command from '../command';

export default class ListModulesCommand extends Command {
	constructor(bot) {
		super(bot);
		this.name = 'modules';
		this.module = 'modules';
		this.memberName = 'list';
		this.description = 'Lists all modules. Only administrators may use this command.';
		this.serverOnly = true;
	}

	hasPermission(server, user) {
		return this.bot.permissions.isAdmin(server, user);
	}

	async run(message) {
		return stripIndents`
			__**Modules:**__
			${this.bot.registry.modules.map(mod => `**- ${mod.name}:** ${mod.isEnabled(message.server) ? 'Enabled' : 'Disabled'}`).join('\n')}
		`;
	}
}
