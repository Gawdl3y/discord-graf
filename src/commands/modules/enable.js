'use babel';
'use strict';

import { stripIndents } from 'common-tags';
import Command from '../command';
import CommandFormatError from '../../errors/command-format';

export default class EnableModuleCommand extends Command {
	constructor(bot) {
		super(bot);
		this.name = 'enablemodule';
		this.aliases = ['enablemod', 'moduleon', 'modon'];
		this.module = 'modules';
		this.memberName = 'enable';
		this.description = 'Enables a module or command.';
		this.usage = 'enablemodule <module|command>';
		this.details = stripIndents`
			The module must be the name (partial or whole) or ID of a module.
			A command name may also be provided instead of a module in order to enable a single command.
			Only administrators may use this command.
		`;
		this.examples = ['enablemodule mod-roles', 'enablemodule Moderator roles', 'enablemodule prefix'];
		this.serverOnly = true;
	}

	hasPermission(server, user) {
		return this.bot.permissions.isAdmin(server, user);
	}

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.server);
		const modules = this.bot.registry.findModules(args[0]);
		if(modules.length === 1) {
			if(modules[0].isEnabled(message.server)) return `The ${modules[0].name} module is already enabled.`;
			modules[0].setEnabled(message.server, true);
			return `Enabled ${modules[0].name} module.`;
		} else if(modules.length > 0) {
			return this.bot.util.disambiguation(modules, 'modules');
		} else {
			const commands = this.bot.registry.findCommands(args[0]);
			if(commands.length === 1) {
				if(commands[0].isEnabled(message.server)) return `The \`${commands[0].name}\` command is already enabled.`;
				commands[0].setEnabled(message.server, true);
				return `Enabled \`${commands[0].name}\` command.`;
			} else if(commands.length > 1) {
				return `No modules found. ${this.bot.util.disambiguation(commands, 'commands')}`;
			} else {
				return `Unable to identify module or command. Use ${this.bot.util.usage('modules', message.server)} to view the list of modules.`;
			}
		}
	}
}
