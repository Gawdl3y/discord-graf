'use babel';
'use strict';

import Setting from '../data/models/setting';

/** A module for commands */
export default class Module {
	/**
	 * @param {Bot} bot - The bot the module is for
	 * @param {string} id - The ID for the module
	 * @param {string} [name=id] - The name of the module
	 * @param {Command[]} [commands] - The commands that the module contains
	 */
	constructor(bot, id, name, commands) {
		if(!bot || !id) throw new Error('A bot and ID must be specified.');
		if(commands && !Array.isArray(commands)) throw new TypeError('Commands must be an array.');

		/** @type {Bot} */
		this.bot = bot;
		/** @type {string} */
		this.id = id;
		/** @type {string} */
		this.name = name || id;
		/** @type {Command[]} */
		this.commands = commands || [];
	}

	/**
	 * Enables or disables the module on a server
	 * @param {Server} server - The server
	 * @param {boolean} enabled - Whether the module should be enabled or disabled
	 * @return {void}
	 */
	setEnabled(server, enabled) {
		this.bot.storage.settings.save(new Setting(server, `mod-${this.id}`, enabled));
	}

	/**
	 * Checks if the module is enabled on a server
	 * @param {Server} server - The server
	 * @return {boolean} Whether or not the module is enabled
	 */
	isEnabled(server) {
		return this.bot.storage.settings.getValue(server, `mod-${this.id}`, true);
	}
}
