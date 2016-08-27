'use babel';
'use strict';

import Command from './command';

/** Builds commands with a fluent API */
export default class CommandBuilder {
	/**
	 * @param {Bot} bot - The bot the command is for
	 * @param {CommandInfo} [info] - The command info
	 * @param {Object} [funcs] - The functions to set
	 */
	constructor(bot, info = null, funcs = null) {
		if(!bot) throw new Error('A bot must be specified.');

		/** @type {Bot} */
		this.bot = bot;
		/** @type {CommandInfo} */
		this.commandInfo = info;

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

	/** @type {Command} */
	get command() {
		if(!this._command) this._command = new Command(this.bot, this.commandInfo);
		return this._command;
	}
}

function _bindAppend(fn, self, ...args) {
	return function boundFunction(...args2) {
		return fn.apply(self, args2.concat(args));
	};
}
