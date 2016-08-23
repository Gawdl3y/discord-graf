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
	 * @param {Server|string} server - The server or server ID
	 * @param {boolean} enabled - Whether the module should be enabled or disabled
	 * @return {void}
	 * @see {@link Module.setEnabled}
	 */
	setEnabled(server, enabled) {
		this.constructor.setEnabled(this.bot.storage.settings, server, this, enabled);
	}

	/**
	 * Enables or disables a module on a server
	 * @param {SettingStorage} settings - The setting storage to use
	 * @param {Server|string} server - The server or server ID
	 * @param {Module|string} module - The module or module ID
	 * @param {boolean} enabled - Whether the module should be enabled or disabled
	 * @return {void}
	 * @see {@link Module#setEnabled}
	 */
	static setEnabled(settings, server, module, enabled) {
		settings.save(new Setting(server, `mod-${module.id || module}`, enabled));
	}

	/**
	 * Checks if the module is enabled on a server
	 * @param {Server} server - The server
	 * @return {boolean} Whether or not the module is enabled
	 * @see {@link Module.isEnabled}
	 */
	isEnabled(server) {
		return this.constructor.isEnabled(this.bot.storage.settings, server, this);
	}

	/**
	 * Checks if a module is enabled on a server
	 * @param {SettingStorage} settings - The setting storage to use
	 * @param {Server} server - The server
	 * @param {Module|string} module - The module or module ID
	 * @return {boolean} Whether or not the module is enabled
	 * @see {@link Module#isEnabled}
	 */
	static isEnabled(settings, server, module) {
		return settings.getValue(server, `mod-${module.id || module}`, true);
	}
}
