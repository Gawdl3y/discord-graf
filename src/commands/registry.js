'use babel';
'use strict';

export default class CommandRegistry {
	constructor(logger) {
		this.logger = logger;
		this.commands = [];
		this.groups = [];
	}

	register(commands) {
		if(!Array.isArray(commands)) commands = [commands];
		for(const command of commands) {
			if(this.commands.some(cmd => cmd.name === command.name)) throw new Error(`A command with the name "${command.name}"" is already registered.`);
			this.commands.push(command);
			let group = this.groups.find(grp => grp.id === command.group);
			if(group) {
				group.commands.push(command);
			} else {
				group = {
					id: command.group,
					name: command.group,
					commands: [command]
				};
				this.groups.push(group);
			}
			if(this.logger) this.logger.verbose(`Registered command ${command.group}:${command.groupName}.`);
		}
	}

	nameGroup(id, name) {
		const group = this.groups.find(grp => grp.id === id);
		if(group) group.name = name; else this.groups.push({ id: id, name: name, commands: [] });
		if(this.logger) this.logger.verbose(`Named group ${id} "${name}".`);
	}

	find(searchString = null, message = null) {
		if(!searchString) return message ? this.commands.filter(cmd => this.constructor.isUsable(cmd, message)) : this.commands;

		// Find all matches
		const lowercaseSearch = searchString.toLowerCase();
		const matchedCommands = this.commands.filter(cmd => cmd.name.includes(lowercaseSearch) || (cmd.aliases && cmd.aliases.some(ali => ali.includes(lowercaseSearch))));

		// See if there's an exact match
		for(const command of matchedCommands) {
			if(command.name === lowercaseSearch || (command.aliases && command.aliases.some(ali => ali === lowercaseSearch))) return [command];
		}

		return matchedCommands;
	}

	static isUsable(command, message = null) {
		if(command.serverOnly && message && !message.server) return false;
		return !command.isRunnable || !message || command.isRunnable(message);
	}
}
