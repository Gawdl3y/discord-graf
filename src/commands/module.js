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
		if(id !== id.toLowerCase()) throw new Error('Module ID must be lowercase.');

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
	 * Enables or disables the module on a guild
	 * @param {Guild|string} guild - The guild or guild ID
	 * @param {boolean} enabled - Whether the module should be enabled or disabled
	 * @return {void}
	 * @see {@link Module.setEnabled}
	 */
	setEnabled(guild, enabled) {
		this.constructor.setEnabled(this.bot.storage.settings, guild, this, enabled);
	}

	/**
	 * Enables or disables a module on a guild
	 * @param {SettingStorage} settings - The setting storage to use
	 * @param {Guild|string} guild - The guild or guild ID
	 * @param {Module|string} module - The module or module ID
	 * @param {boolean} enabled - Whether the module should be enabled or disabled
	 * @return {void}
	 * @see {@link Module#setEnabled}
	 */
	static setEnabled(settings, guild, module, enabled) {
		settings.save(new Setting(guild, `mod-${module.id || module}`, enabled));
	}

	/**
	 * Checks if the module is enabled on a guild
	 * @param {Guild} guild - The guild
	 * @return {boolean} Whether or not the module is enabled
	 * @see {@link Module.isEnabled}
	 */
	isEnabled(guild) {
		return this.constructor.isEnabled(this.bot.storage.settings, guild, this);
	}

	/**
	 * Checks if a module is enabled on a guild
	 * @param {SettingStorage} settings - The setting storage to use
	 * @param {Guild} guild - The guild
	 * @param {Module|string} module - The module or module ID
	 * @return {boolean} Whether or not the module is enabled
	 * @see {@link Module#isEnabled}
	 */
	static isEnabled(settings, guild, module) {
		return settings.getValue(guild, `mod-${module.id || module}`, true);
	}
}
