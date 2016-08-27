'use babel';
'use strict';

import Command from './command';

/** Builds commands with a fluent API */
export default class CommandBuilder {
	/**
	 * @param {Bot} bot - The bot the command is for
	 * @param {CommandInfo} [info] - The command info
	 * @param {CommandBuilderFunctions} [funcs] - The command functions to set
	 */
	constructor(bot, info = null, funcs = null) {
		if(!bot) throw new Error('A bot must be specified.');

		/** @type {Bot} */
		this.bot = bot;
		/** @type {CommandInfo} */
		this.commandInfo = info;
		/** @type {Command} */
		this.command = null;

		if(info) this.command = new Command(bot, info);
		if(funcs) {
			if(funcs.run) this.run(funcs.run);
			if(funcs.hasPermission) this.hasPermission(funcs.hasPermission);
		}
	}

	/**
	 * Sets the command information. This must be used before any other method if info was not provided to the constructor.
	 * @param {CommandInfo} info - The command info
	 * @return {CommandBuilder} This builder
	 */
	info(info) {
		this.commandInfo = info;
		this.command = new Command(this.bot, info);
		return this;
	}

	/**
	 * Sets the command's run method
	 * @param {function} fn - The function to use
	 * @param {*[]} [extras=[]] - Extra values to pass to the function
	 * @return {CommandBuilder} This builder
	 */
	run(fn, extras = []) {
		if(typeof fn !== 'function') throw new TypeError('run must be provided a function.');
		if(!this.command) throw new Error('.info(obj) must be called first.');
		this.command.run = _bindAppend(fn, this.command, ...extras);
		return this;
	}

	/**
	 * Sets the command's hasPermission method
	 * @param {function} fn - The function to use
	 * @param {*[]} [extras=[]] - Extra values to pass to the function
	 * @return {CommandBuilder} This builder
	 */
	hasPermission(fn, extras = []) {
		if(typeof fn !== 'function') throw new TypeError('hasPermission must be provided a function.');
		if(!this.command) throw new Error('.info(obj) must be called first.');
		this.command.hasPermission = _bindAppend(fn, this.command, ...extras);
		return this;
	}

	/**
	 * Registers the command to the bot
	 * @return {void}
	 */
	register() {
		this.bot.registerCommand(this.command);
	}
}

function _bindAppend(fn, self, ...args) {
	return function boundFunction(...args2) {
		return fn.apply(self, args2.concat(args));
	};
}

/**
 * @typedef {Object} CommandBuilderFunctions
 * @property {function} [run] - The run function to set
 * @property {function} [hasPermission] - The hasPermission function to set
 */
