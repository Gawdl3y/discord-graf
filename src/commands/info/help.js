'use babel';
'use strict';

import { stripIndents, oneLine } from 'common-tags';
import Command from '../command';

export default class HelpCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'help',
			module: 'info',
			memberName: 'help',
			aliases: ['commands'],
			description: 'Displays a list of available commands, or detailed information for a specified command.',
			usage: 'help [command]',
			details: 'The command may be part of a command name or a whole command name. If it isn\'t specified, all available commands will be listed.',
			examples: ['help', 'help roll']
		});
	}

	async run(message, args) {
		const util = this.bot.util;
		const modules = this.bot.registry.modules;
		const commands = this.bot.registry.findCommands(args[0], message);
		const showAll = args[0] && args[0].toLowerCase() === 'all';
		if(args[0] && !showAll) {
			if(commands.length === 1) {
				let help = stripIndents`
					__Command **${commands[0].name}**:__ ${commands[0].description}${commands[0].guildOnly ? ' (Usable only in guilds)' : ''}

					**Usage:** ${util.usage(commands[0].usage, message.guild)}
				`;
				if(commands[0].aliases) help += `\n**Aliases:** ${commands[0].aliases.join(', ')}`;
				help += `\n**Module:** ${this.bot.registry.findModules(commands[0].module)[0].name} (\`${commands[0].module}:${commands[0].memberName}\`)`;
				if(commands[0].details) help += `\n**Details:** ${commands[0].details}`;
				if(commands[0].examples) help += `\n**Examples:**\n${commands[0].examples.join('\n')}`;
				return { direct: help, reply: 'Sent a DM to you with information.' };
			} else if(commands.length > 1) {
				return util.disambiguation(commands, 'commands');
			} else {
				return `Unable to identify command. Use ${util.usage('help', message.guild)} to view the list of all commands.`;
			}
		} else {
			return {
				direct: util.split(stripIndents`
					${oneLine`
						To run a command in ${message.guild ? message.guild : 'any server'},
						use ${util.usage('command', message.guild, !message.guild)}.
						For example, ${util.usage('roll d20', message.guild, !message.guild)}.
					`}
					To run a command in this DM, simply use ${util.usage('command')} with no prefix. For example, ${util.usage('roll d20')}.
					Hyphens (\`-\`) are always optional in commands.

					Use ${util.usage('help <command>')} to view detailed information about a specific command.
					Use ${util.usage('help all')} to view a list of *all* commands, not just available ones.

					__**${showAll ? 'All commands' : `Available commands in ${message.guild ? message.guild : 'this DM'}`}**__

					${(showAll ? modules : modules.filter(mod => mod.commands.some(cmd => cmd.isUsable(message)))).map(mod => stripIndents`
						__${mod.name}__
						${(showAll ? mod.commands : mod.commands.filter(cmd => cmd.isUsable(message)))
							.map(cmd => `**${cmd.name}:** ${cmd.description}`).join('\n')
						}
					`).join('\n\n')}
				`),
				reply: message.guild ? 'Sent a DM to you with information.' : null
			};
		}
	}
}
