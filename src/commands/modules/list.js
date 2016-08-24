'use babel';
'use strict';

import { stripIndents } from 'common-tags';
import Command from '../command';

export default class ListModulesCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'modules',
			aliases: ['list-modules', 'show-modules'],
			module: 'modules',
			memberName: 'list',
			description: 'Lists all modules.',
			details: 'Only administrators may use this command.',
			guildOnly: true
		});
	}

	hasPermission(guild, user) {
		return this.bot.permissions.isAdmin(guild, user);
	}

	async run(message) {
		return stripIndents`
			__**Modules**__
			${this.bot.registry.modules.map(mod => `**${mod.name}:** ${mod.isEnabled(message.guild) ? 'Enabled' : 'Disabled'}`).join('\n')}
		`;
	}
}
