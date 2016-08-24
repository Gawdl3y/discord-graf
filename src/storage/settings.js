'use babel';
'use strict';

import GuildStorage from '.';
import Setting from './models/setting';

/** Stores settings within a guild */
export default class SettingStorage extends GuildStorage {
	/**
	 * @param {LocalStorage} localStorage - The LocalStorage instance to use
	 * @param {Logger} [logger] - The logger to use
	 */
	constructor(localStorage, logger) {
		super('settings', localStorage, logger, true);
	}

	/**
	 * Saves a setting to the storage
	 * @param {Setting} setting - The setting to save
	 * @return {boolean} Whether or not the setting was saved
	 * @see {@link GuildStorage#save}
	 */
	save(setting) {
		return super.save(setting.guild, setting);
	}

	/**
	 * Deletes a setting from the storage
	 * @param {Guild|string} [guild] - The guild or guild ID the setting is associated with
	 * @param {Setting|string} setting - The setting or setting key (must be a setting instance if the guild isn't specified)
	 * @return {boolean} Whether or not the setting was deleted
	 * @see {@link GuildStorage#delete}
	 */
	delete(guild, setting) {
		[guild, setting] = this._getSettingGuildAndKey(setting, guild);
		return super.delete(guild, setting);
	}

	/**
	 * Finds all settings associated with a guild or a single one with a key
	 * @param {Guild|string} [guild] - The guild or guild ID to find the settings of
	 * @param {Setting|string} setting - The setting or setting key (must be a setting instance if the guild isn't specified)
	 * @return {*[]} - All found setting values
	 * @see {@link GuildStorage#find}
	 */
	find(guild, setting) {
		[guild, setting] = this._getSettingGuildAndKey(setting, guild, false);
		return super.find(guild, setting);
	}

	/**
	 * Checks if a setting associated with a guild exists
	 * @param {Guild|string} [guild] - The guild or guild ID the setting is associated with
	 * @param {Setting|string} setting - The setting or setting key
	 * @return {boolean} Whether or not the setting exists
	 * @see {@link GuildStorage#exists}
	 */
	exists(guild, setting) {
		[guild, setting] = this._getSettingGuildAndKey(setting, guild);
		return super.exists(guild, setting);
	}

	/**
	 * Gets the value of a setting associated with a guild
	 * @param {Guild|string} [guild] - The guild or guild ID the setting is associated with
	 * @param {Setting|string} setting - The setting or setting key (must be a setting instance if the guild isn't specified)
	 * @param {*} [defaultValue=null] - The value to default to if the setting doesn't exist
	 * @return {*} The value of the setting
	 */
	getValue(guild, setting, defaultValue = null) {
		[guild, setting] = this._getSettingGuildAndKey(setting, guild);
		if(!this.guildsMap) this.loadStorage();
		if(!this.guildsMap[guild]) return defaultValue;
		if(!(setting in this.guildsMap[guild])) return defaultValue;
		return this.guildsMap[guild][setting];
	}

	_getSettingGuildAndKey(setting, guild, requireSetting = true) {
		if(setting instanceof Setting) {
			return [!guild ? setting.guild : guild.id || guild, setting.key];
		} else {
			if(!setting && requireSetting) throw new Error('A setting or a key must be specified.');
			return [guild ? guild.id || guild : 'global', setting];
		}
	}
}
