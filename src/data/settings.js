'use babel';
'use strict';

import Storage from './storage';
import Setting from './models/setting';

export default class SettingStorage extends Storage {
	constructor(localStorage, logger) {
		super('settings', localStorage, logger);
	}

	save(setting) {
		return super.save(setting.server, setting, entry => entry.key === setting.key);
	}

	delete(setting) {
		return super.delete(setting.server, setting, entry => entry.key === setting.key);
	}

	find(setting, server = null, searchOptions = {}) {
		[setting, server] = this.getSettingKeyAndServer(setting, server);
		return super.find(server, setting, Object.assign(searchOptions, { property: 'key', searchInexact: false }));
	}

	exists(setting, server = null) {
		[setting, server] = this.getSettingKeyAndServer(setting, server);
		return super.exists(server, setting, entry => entry.key === setting);
	}

	getValue(setting, defaultValue = null, server = null) {
		[setting, server] = this.getSettingKeyAndServer(setting, server);
		if(!this.serversMap) this.loadStorage();
		if(!this.serversMap[server]) return defaultValue;
		const settings = this.find(server, setting);
		if(settings.length === 0) return defaultValue;
		return settings[0].value;
	}

	getSettingKeyAndServer(setting, server) {
		if(setting instanceof Setting) {
			return [setting.key, !server ? setting.server : server.id ? server.id : server];
		} else {
			if(!setting) throw new Error('A setting or a key must be specified.');
			return [setting, server ? server.id ? server.id : server : 'global'];
		}
	}
}
