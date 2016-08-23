'use babel';
'use strict';

import { stripIndents } from 'common-tags';
import Command from '../command';

export default class ListModulesCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'modules',
			aliases: ['listmodules', 'showmodules'],
			module: 'modules',
			memberName: 'list',
			description: 'Lists all modules.',
			details: 'Only administrators may use this command.',
			serverOnly: true
		});
	}

	hasPermission(server, user) {
		return this.bot.permissions.isAdmin(server, user);
	}

	async run(message) {
		return stripIndents`
			__**Modules**__
			${this.bot.registry.modules.map(mod => `**${mod.name}:** ${mod.isEnabled(message.server) ? 'Enabled' : 'Disabled'}`).join('\n')}
		`;
	}
}
