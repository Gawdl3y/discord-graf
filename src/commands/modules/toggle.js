'use babel';
'use strict';

import { oneLine } from 'common-tags';
import Command from '../command';
import CommandFormatError from '../../errors/command-format';

export default class ToggleModuleCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'togglemodule',
			aliases: ['togglemod', 'module'],
			module: 'modules',
			memberName: 'toggle',
			description: 'Toggles a module or command.',
			usage: 'togglemodule <module|command>',
			details: oneLine`
				The module must be the name (partial or whole) or ID of a module.
				A command name may also be provided instead of a module in order to toggle a single command.
				Only administrators may use this command.
			`,
			examples: ['togglemodule mod-roles', 'togglemodule Moderator roles', 'togglemodule prefix'],
			serverOnly: true
		});
	}

	hasPermission(server, user) {
		return this.bot.permissions.isAdmin(server, user);
	}

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.server);
		const modules = this.bot.registry.findModules(args[0]);
		if(modules.length === 1) {
			if(modules[0].id === 'modules') return `You cannot toggle the ${modules[0].name} module.`;
			modules[0].setEnabled(message.server, !modules[0].isEnabled(message.server));
			return `${modules[0].isEnabled(message.server) ? 'Enabled' : 'Disabled'} ${modules[0].name} module.`;
		} else if(modules.length > 0) {
			return this.bot.util.disambiguation(modules, 'modules');
		} else {
			const commands = this.bot.registry.findCommands(args[0]);
			if(commands.length === 1) {
				if(commands[0].module === 'modules') return `You cannot toggle the \`${commands[0].name}\` command.`;
				commands[0].setEnabled(message.server, !commands[0].isEnabled(message.server));
				return `${commands[0].isEnabled(message.server) ? 'Enabled' : 'Disabled'} \`${commands[0].name}\` command.`;
			} else if(commands.length > 1) {
				return `No modules found. ${this.bot.util.disambiguation(commands, 'commands')}`;
			} else {
				return `Unable to identify module or command. Use ${this.bot.util.usage('modules', message.server)} to view the list of modules.`;
			}
		}
	}
}
