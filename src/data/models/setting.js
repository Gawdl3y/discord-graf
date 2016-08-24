'use babel';
'use strict';

/** A guild-specific setting */
export default class Setting {
	/**
	 * @param {?Guild|string} guild - The guild or guild ID ('global' if empty)
	 * @param {string} key - The key of the setting
	 * @param {*} [value] - The value of the setting
	 */
	constructor(guild, key, value) {
		if(!key) throw new Error('Setting key must be specified.');

		/** @type {string} */
		this.guild = guild ? guild.id ? guild.id : guild : 'global';
		/** @type {string} */
		this.key = key;
		/** @type {*} */
		this.value = value;
	}
}
