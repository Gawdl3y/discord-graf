'use babel';
'use strict';

import Storage from './storage';
import Setting from './models/setting';

export default class SettingStorage extends Storage {
	constructor(localStorage, logger) {
		super('settings', localStorage, logger, true);
	}

	save(setting) {
		return super.save(setting.server, setting);
	}

	delete(server, setting) {
		[server, setting] = this.getSettingServerAndKey(setting, server);
		return super.delete(server, setting);
	}

	find(server, setting) {
		[server, setting] = this.getSettingServerAndKey(setting, server);
		return super.find(server, setting);
	}

	exists(server, setting) {
		[server, setting] = this.getSettingServerAndKey(setting, server);
		return super.exists(server, setting);
	}

	getValue(server, setting, defaultValue = null) {
		[server, setting] = this.getSettingServerAndKey(setting, server);
		if(!this.serversMap) this.loadStorage();
		if(!this.serversMap[server]) return defaultValue;
		if(!(setting in this.serversMap[server])) return defaultValue;
		return this.serversMap[server][setting];
	}

	getSettingServerAndKey(setting, server) {
		if(setting instanceof Setting) {
			return [!server ? setting.server : server.id ? server.id : server, setting.key];
		} else {
			if(!setting) throw new Error('A setting or a key must be specified.');
			return [server ? server.id ? server.id : server : 'global', setting];
		}
	}
}
