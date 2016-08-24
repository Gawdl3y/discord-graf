'use babel';
'use strict';

import Storage from './storage';
import Setting from './models/setting';

export default class SettingStorage extends Storage {
	constructor(localStorage, logger) {
		super('settings', localStorage, logger, true);
	}

	save(setting) {
		return super.save(setting.guild, setting);
	}

	delete(guild, setting) {
		[guild, setting] = this.getSettingGuildAndKey(setting, guild);
		return super.delete(guild, setting);
	}

	find(guild, setting) {
		[guild, setting] = this.getSettingGuildAndKey(setting, guild);
		return super.find(guild, setting);
	}

	exists(guild, setting) {
		[guild, setting] = this.getSettingGuildAndKey(setting, guild);
		return super.exists(guild, setting);
	}

	getValue(guild, setting, defaultValue = null) {
		[guild, setting] = this.getSettingGuildAndKey(setting, guild);
		if(!this.guildsMap) this.loadStorage();
		if(!this.guildsMap[guild]) return defaultValue;
		if(!(setting in this.guildsMap[guild])) return defaultValue;
		return this.guildsMap[guild][setting];
	}

	getSettingGuildAndKey(setting, guild) {
		if(setting instanceof Setting) {
			return [!guild ? setting.guild : guild.id ? guild.id : guild, setting.key];
		} else {
			if(!setting) throw new Error('A setting or a key must be specified.');
			return [guild ? guild.id ? guild.id : guild : 'global', setting];
		}
	}
}
