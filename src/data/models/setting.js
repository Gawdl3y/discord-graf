'use babel';
'use strict';

/** A server-specific setting */
export default class Setting {
	/**
	 * @param {?Server|string} server - The server or server ID ('global' if empty)
	 * @param {string} key - The key of the setting
	 * @param {*} [value] - The value of the setting
	 */
	constructor(server, key, value) {
		if(!key) throw new Error('Setting key must be specified.');

		/** @type {string} */
		this.server = server ? server.id ? server.id : server : 'global';
		/** @type {string} */
		this.key = key;
		/** @type {*} */
		this.value = value || null;
	}
}
