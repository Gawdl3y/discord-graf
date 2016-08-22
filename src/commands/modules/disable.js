'use babel';
'use strict';

import { stripIndents } from 'common-tags';
import Command from '../command';
import CommandFormatError from '../../errors/command-format';

export default class DisableModuleCommand extends Command {
	constructor(bot) {
		super(bot);
		this.name = 'disablemodule';
		this.aliases = ['disablemod', 'moduleoff', 'modoff'];
		this.module = 'modules';
		this.memberName = 'disable';
		this.description = 'Disables a module or command.';
		this.usage = 'disablemodule <module|command>';
		this.details = stripIndents`
			The module must be the name (partial or whole) or ID of a module.
			A command name may also be provided instead of a module in order to disable a single command.
			Only administrators may use this command.
		`;
		this.examples = ['disablemodule mod-roles', 'disablemodule Moderator roles', 'disablemodule prefix'];
		this.serverOnly = true;
	}

	isRunnable(message) {
		return this.bot.permissions.isAdmin(message.server, message.author);
	}

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.server);
		const modules = this.bot.registry.findModules(args[0]);
		if(modules.length === 1) {
			if(modules[0].id === 'modules') return `You cannot disable the ${modules[0].name} module.`;
			if(!modules[0].isEnabled(message.server)) return `The ${modules[0].name} module is already disabled.`;
			modules[0].setEnabled(message.server, false);
			return `Disabled ${modules[0].name} module.`;
		} else if(modules.length > 0) {
			return this.bot.util.disambiguation(modules, 'modules');
		} else {
			const commands = this.bot.registry.findCommands(args[0]);
			if(commands.length === 1) {
				if(commands[0].module === 'modules') return `You cannot disable the \`${commands[0].name}\` command.`;
				if(!commands[0].isEnabled(message.server)) return `The \`${commands[0].name}\` command is already disabled.`;
				commands[0].setEnabled(message.server, false);
				return `Disabled \`${commands[0].name}\` command.`;
			} else if(commands.length > 1) {
				return `No modules found. ${this.bot.util.disambiguation(commands, 'commands')}`;
			} else {
				return `Unable to identify module or command. Use ${this.bot.util.usage('modules', message.server)} to view the list of modules.`;
			}
		}
	}
}
