'use babel';
'use strict';

import bot from '../';

export default class Setting {
	constructor(server, key, value) {
		if(!key) throw new Error('Setting key must be specified.');
		this.key = key;
		this.value = value;
		this.server = server ? server.id ? server.id : server : 'global';
	}

	static loadDatabase() {
		this.serversMap = JSON.parse(bot.storage.getItem('settings'));
		if(!this.serversMap) this.serversMap = {};
	}

	static saveDatabase() {
		bot.logger.debug('Saving settings storage...', this.serversMap);
		bot.storage.setItem('settings', JSON.stringify(this.serversMap));
	}

	static save(setting) {
		if(!setting) throw new Error('A setting must be specified.');
		if(!this.serversMap) this.loadDatabase();
		if(!this.serversMap[setting.server]) this.serversMap[setting.server] = {};
		this.serversMap[setting.server][setting.key] = setting.value;
		bot.logger.info('Saved setting.', setting);
		this.saveDatabase();
		return true;
	}

	static delete(setting, server = null) {
		[setting, server] = this.getSettingKeyAndServer(setting, server);
		if(!this.serversMap) this.loadDatabase();
		if(!this.serversMap[server]) return false;
		if(typeof this.serversMap[server][setting] === 'undefined') return false;
		delete this.serversMap[server][setting];
		bot.logger.info('Deleted setting.', { key: setting, server: server });
		this.saveDatabase();
		return true;
	}

	static get(setting, server = null) {
		[setting, server] = this.getSettingKeyAndServer(setting, server);
		if(!this.serversMap) this.loadDatabase();
		if(!this.serversMap[server]) return null;
		return new Setting(server, setting, this.serversMap[server][setting]);
	}

	static getValue(setting, defaultValue = null, server = null) {
		[setting, server] = this.getSettingKeyAndServer(setting, server);
		if(!this.serversMap) this.loadDatabase();
		if(!this.serversMap[server]) return defaultValue;
		return setting in this.serversMap[server] ? this.serversMap[server][setting] : defaultValue;
	}


	static getSettingKeyAndServer(setting, server) {
		if(setting instanceof Setting) {
			return [setting.key, !server ? setting.server : server.id ? server.id : server];
		} else {
			if(!setting) throw new Error('A setting or a key must be specified.');
			return [setting, server ? server.id ? server.id : server : 'global'];
		}
	}
}
