'use babel';
'use strict';

import bot from '../';

export const commands = [];
export const groups = [];

// Register a command
export function register(command) {
	if(commands.some(cmd => cmd.name === command.name)) throw new Error(`A command with the name "${command.name}"" is already registered.`);
	commands.push(command);
	let group = groups.find(grp => grp.id === command.group);
	if(group) {
		group.commands.push(command);
	} else {
		group = {
			id: command.group,
			name: command.group,
			commands: [command]
		};
		groups.push(group);
	}
	bot.logger.verbose(`Registered command ${command.group}:${command.groupName}.`);
}

// Name a group
export function nameGroup(id, name) {
	groups.find(grp => grp.id === id).name = name;
	bot.logger.verbose(`Named group ${id} "${name}".`);
}

// Find all commands, or commands that match a search string
export function find(searchString = null, message = null) {
	if(!searchString) return message ? commands.filter(cmd => isUsable(cmd, message)) : commands;

	// Find all matches
	const lowercaseSearch = searchString.toLowerCase();
	const matchedCommands = commands.filter(cmd => cmd.name.includes(lowercaseSearch) || (cmd.aliases && cmd.aliases.some(ali => ali.includes(lowercaseSearch))));

	// See if there's an exact match
	for(const command of matchedCommands) {
		if(command.name === lowercaseSearch || (command.aliases && command.aliases.some(ali => ali === lowercaseSearch))) return [command];
	}

	return matchedCommands;
}

// Check to make sure a command is runnable
export function isUsable(command, message = null) {
	if(command.serverOnly && message && !message.server) return false;
	return !command.isRunnable || !message || command.isRunnable(message);
}
