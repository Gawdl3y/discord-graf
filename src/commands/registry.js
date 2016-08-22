'use babel';
'use strict';

import EventEmitter from 'events';
import Module from './module';

/** Handles registration and searching of commands and modules */
export default class CommandRegistry extends EventEmitter {
	/** @param {?Logger} [logger] - The logger to use  */
	constructor(logger) {
		super();

		/** @type {?Logger} */
		this.logger = logger || null;
		/** @type {Command[]} */
		this.commands = [];
		/** @type {Module[]} */
		this.modules = [];
	}

	/**
	 * Registers a single command
	 * @param {Command} command - The command to register
	 * @return {void}
	 */
	registerCommand(command) {
		this.registerCommands([command]);
	}

	/**
	 * Registers multiple commands
	 * @param {Command[]} commands - The commands to register
	 * @return {void}
	 */
	registerCommands(commands) {
		if(!Array.isArray(commands)) throw new TypeError('Commands must be an array.');
		for(let command of commands) {
			if(this.commands.some(cmd => cmd.name === command.name)) throw new Error(`A command with the name "${command.name}"" is already registered.`);
			const module = this.modules.find(mod => mod.id === command.module);
			if(!module) throw new Error(`Module "${command.module}" is not registered.`);
			if(module.commands.some(cmd => cmd.memberName === command.memberName)) throw new Error(`A command with the member name "${command.memberName}" is already registered in ${module.id}`);
			module.commands.push(command);
			this.commands.push(command);
			if(this.logger) this.logger.verbose(`Registered command ${command.module}:${command.memberName}.`);
			this.emit('commandRegister', command, this);
		}
	}

	/**
	 * Registers a single module
	 * @param {Module} module - The module to register
	 * @return {void}
	 */
	registerModule(module) {
		this.registerModules([module]);
	}

	/**
	 * Registers multiple modules
	 * @param {Module[]} modules - The modules to register
	 * @return {void}
	 */
	registerModules(modules) {
		if(!Array.isArray(modules)) throw new TypeError('Modules must be an array.');
		for(let module of modules) {
			if(!(module instanceof Module)) throw new TypeError('Module must be an instance of Module.');
			if(this.modules.some(mod => mod.name === module.name)) throw new Error(`Module "${module.name}"" is already registered.`);
			this.modules.push(module);
			if(this.logger) this.logger.verbose(`Registered module ${module.id}.`);
			this.emit('moduleRegister', module, this);
		}
	}

	/**
	 * Finds all commands that match the search string
	 * @param {string} [searchString] - The string to search for
	 * @param {Message} [message] - The message to check usability against
	 * @return {Command[]} All commands that are found
	 */
	findCommands(searchString = null, message = null) {
		if(!searchString) return message ? this.commands.filter(cmd => cmd.isUsable(message)) : this.commands;

		// Find all matches
		const lowercaseSearch = searchString.toLowerCase();
		const matchedCommands = this.commands.filter(cmd =>
			cmd.name.includes(lowercaseSearch)
			|| (cmd.aliases && cmd.aliases.some(ali => ali.includes(lowercaseSearch)))
			|| `${cmd.module}:${cmd.memberName}` === lowercaseSearch
		);

		// See if there's an exact match
		for(const command of matchedCommands) {
			if(command.name === lowercaseSearch || (command.aliases && command.aliases.some(ali => ali === lowercaseSearch))) return [command];
		}

		return matchedCommands;
	}

	/**
	 * Finds all modules that match the search string
	 * @param {string} [searchString] - The string to search for
	 * @return {Module[]} All modules that are found
	 */
	findModules(searchString = null) {
		if(!searchString) return this.modules;

		// Find all matches
		const lowercaseSearch = searchString.toLowerCase();
		const matchedModules = this.modules.filter(mod => mod.name.includes(lowercaseSearch) || mod.id.includes(lowercaseSearch));

		// See if there's an exact match
		for(const module of matchedModules) {
			if(module.name.toLowerCase() === lowercaseSearch || module.id === lowercaseSearch) return [module];
		}

		return matchedModules;
	}
}
