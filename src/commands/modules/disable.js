'use babel';
'use strict';

import { oneLine } from 'common-tags';
import Command from '../command';
import CommandFormatError from '../../errors/command-format';

export default class DisableModuleCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'disable-module',
			aliases: ['disable-mod', 'module-off', 'mod-off'],
			module: 'modules',
			memberName: 'disable',
			description: 'Disables a module or command.',
			usage: 'disablemodule <module|command>',
			details: oneLine`
				The module must be the name (partial or whole) or ID of a module.
				A command name may also be provided instead of a module in order to disable a single command.
				Only administrators may use this command.
			`,
			examples: ['disablemodule mod-roles', 'disablemodule Moderator roles', 'disablemodule prefix'],
			guildOnly: true
		});
	}

	hasPermission(guild, user) {
		return this.bot.permissions.isAdmin(guild, user);
	}

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.guild);
		const modules = this.bot.registry.findModules(args[0]);
		if(modules.length === 1) {
			if(modules[0].id === 'modules') return `You cannot disable the ${modules[0].name} module.`;
			if(!modules[0].isEnabled(message.guild)) return `The ${modules[0].name} module is already disabled.`;
			modules[0].setEnabled(message.guild, false);
			return `Disabled ${modules[0].name} module.`;
		} else if(modules.length > 0) {
			return this.bot.util.disambiguation(modules, 'modules');
		} else {
			const commands = this.bot.registry.findCommands(args[0]);
			if(commands.length === 1) {
				if(commands[0].module === 'modules') return `You cannot disable the \`${commands[0].name}\` command.`;
				if(!commands[0].isEnabled(message.guild)) return `The \`${commands[0].name}\` command is already disabled.`;
				commands[0].setEnabled(message.guild, false);
				return `Disabled \`${commands[0].name}\` command.`;
			} else if(commands.length > 1) {
				return `No modules found. ${this.bot.util.disambiguation(commands, 'commands')}`;
			} else {
				return `Unable to identify module or command. Use ${this.bot.util.usage('modules', message.guild)} to view the list of modules.`;
			}
		}
	}
}
