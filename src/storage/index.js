'use babel';
'use strict';

import Util from '../bot/util';

/** Stores data entries associated with guilds */
export default class GuildStorage {
	/**
	 * @param {string} key - The key of the storage in the LocalStorage
	 * @param {LocalStorage} localStorage - The LocalStorage instance to use
	 * @param {Logger} [logger] - The logger to use
	 * @param {boolean} [objectBased=false] - If true, the storage will be object based. If false, it will be array-based.
	 */
	constructor(key, localStorage, logger, objectBased = false) {
		if(!key || !localStorage) throw new Error('A key and localStorage must be specified.');
		/** @type {string} */
		this.key = key;
		/** @type {LocalStorage} */
		this.localStorage = localStorage;
		/** @type {?Logger} */
		this.logger = logger;
		/** @type {boolean} */
		this.objectBased = objectBased || false;
		/** @type {Object} */
		this.guildsMap = null;
	}

	/**
	 * Loads the data from LocalStorage
	 * @return {void}
	 */
	loadStorage() {
		this.guildsMap = JSON.parse(this.localStorage.getItem(this.key));
		if(!this.guildsMap) this.guildsMap = {};
	}

	/**
	 * Saves the data to LocalStorage
	 * @return {void}
	 */
	saveStorage() {
		if(!this.guildsMap) throw new Error('Trying to save before load');
		this.localStorage.setItem(this.key, JSON.stringify(this.guildsMap));
		if(this.logger) this.logger.debug(`Saved ${this.key} storage.`, this.guildsMap);
	}

	/**
	 * Saves an entry associated with a guild
	 * @param {Guild|string} guild - The guild or guild ID the entry should be associated with
	 * @param {*|Object} entry - If the storage is array-based, this can be any value to store.
	 * If it is object-based, this must be an object with "key" and "value" properties to store.
	 * @param {function} [searchFunction] - The function to find existing entries (See {@link GuildStorage#exists})
	 * @return {boolean} Whether or not the entry was saved (will be false only if the storage is array-based and the entry already exists)
	 */
	save(guild, entry, searchFunction = null) {
		if(!guild || !entry) throw new Error('A guild and entry must be specified.');
		if(!this.guildsMap) this.loadStorage();
		if(guild.id) guild = guild.id;
		if(!this.guildsMap[guild]) this.guildsMap[guild] = this.objectBased ? {} : [];

		const exists = this.exists(guild, entry, searchFunction);
		if(!exists || this.objectBased) {
			if(this.objectBased) this.guildsMap[guild][entry.key] = entry.value; else this.guildsMap[guild].push(entry);
			this.saveStorage();
			if(this.logger) this.logger.verbose(`${exists ? `Updated` : `Added`} entry in ${this.key} storage.`, { guild: guild, entry: entry });
			return true;
		} else {
			if(this.logger) this.logger.verbose(`Not adding entry to ${this.key} storage, because it already exists.`, { guild: guild, entry: entry });
			return false;
		}
	}

	/**
	 * Deletes an entry associated with a guild
	 * @param {Guild|string} guild - The guild or guild ID the entry is associated with
	 * @param {*|Object|string} entry - If the storage is array-based, this can be any value to find and delete.
	 * If it is object-based, this must be an object with a "key" property, or a string that is the key.
	 * @param {function} [searchFunction] - The function to find existing entries (See {@link GuildStorage#exists})
	 * @return {boolean} Whether or not the entry was deleted
	 */
	delete(guild, entry, searchFunction = null) {
		if(!guild || !entry) throw new Error('A guild and entry must be specified.');
		if(!this.guildsMap) this.loadStorage();
		if(guild.id) guild = guild.id;
		if(!this.guildsMap[guild]) this.guildsMap[guild] = this.objectBased ? {} : [];

		let index = this.objectBased ? null : -1;
		if(this.objectBased) {
			if(searchFunction) {
				for(const entryKey of Object.keys(this.guildsMap)) {
					if(searchFunction(entryKey, this.guildsMap[guild][entryKey])) {
						index = entryKey;
						break;
					}
				}
			} else {
				index = entry.key || entry;
			}
		} else {
			index = searchFunction ? this.guildsMap[guild].findIndex(searchFunction) : this.guildsMap[guild].findIndex(item => item === entry);
		}

		if((this.objectBased && index) || (!this.objectBased && index >= 0)) {
			if(this.objectBased) delete this.guildsMap[guild][index]; else this.guildsMap[guild].splice(index, 1);
			this.saveStorage();
			if(this.logger) this.logger.info(`Deleted entry from ${this.key} storage.`, { guild: guild, entry: entry });
			return true;
		} else {
			if(this.logger) this.logger.info(`Not deleting entry from ${this.key} storage, because it doesn\'t exist.`, { guild: guild, entry: entry });
			return false;
		}
	}

	/**
	 * Clears all entries associated with a guild
	 * @param {Guild|string} guild - The guild or guild ID to clear the entries of
	 * @return {void}
	 */
	clear(guild) {
		if(!guild) throw new Error('A guild must be specified.');
		if(!this.guildsMap) this.loadStorage();
		delete this.guildsMap[guild.id || guild];
		if(this.logger) this.logger.info(`Cleared a guild in ${this.key} storage.`, { guild: guild.id || guild });
		this.saveStorage();
	}

	/**
	 * Clears all entries
	 * @return {void}
	 */
	clearAll() {
		if(!this.guildsMap) this.loadStorage();
		for(const key of Object.keys(this.guildsMap)) delete this.guildsMap[key];
		if(this.logger) this.logger.info(`Cleared all of ${this.key} storage.`);
		this.saveStorage();
	}

	/**
	 * Finds all entries in a storage that optionally match a search string
	 * @param {Guild|string} guild - The guild or guild ID to find the entries of
	 * @param {string} [searchString] - The string to match entries against
	 * @param {SearchOptions} [searchOptions] - Options for the search
	 * @return {*[]} - All found entries
	 */
	find(guild, searchString = null, searchOptions = {}) {
		if(!guild) throw new Error('A guild must be specified.');
		if(!this.guildsMap) this.loadStorage();
		if(guild.id) guild = guild.id;
		if(!this.guildsMap[guild]) return [];
		if(!searchString) return this.guildsMap[guild];
		if(this.objectBased) {
			if(this.guildsMap[guild][searchString]) return [this.guildsMap[guild][searchString]];
			else return [];
		} else {
			return Util.search(this.guildsMap[guild], searchString, searchOptions);
		}
	}

	/**
	 * Checks if an entry associated with a guild exists
	 * @param {Guild|string} guild - The guild or guild ID the entry is associated with
	 * @param {*|Object|string} entry - If the storage is array-based, this can be any value to check existence of.
	 * If it is object-based, this must be an object with a "key" property, or a string that is the key.
	 * @param {function} [searchFunction] - The function to find existing entries. If the storage is array-based, it will be passed the value of each entry.
	 * If it is object-based, it will be passed the key and value of each entry.
	 * @return {boolean} Whether or not the entry exists
	 */
	exists(guild, entry, searchFunction = null) {
		if(!guild || !entry) throw new Error('A guild and entry must be specified.');
		if(!this.guildsMap) this.loadStorage();
		if(guild.id) guild = guild.id;
		if(!this.guildsMap[guild]) return false;
		if(this.objectBased) {
			if(searchFunction) {
				for(const entryKey of Object.keys(this.guildsMap[guild])) {
					if(searchFunction(entryKey, this.guildsMap[guild][entryKey])) return true;
				}
				return false;
			} else {
				return typeof this.guildsMap[guild][entry.key || entry] !== 'undefined';
			}
		} else {
			return searchFunction ? this.guildsMap[guild].some(searchFunction) : this.guildsMap[guild].includes(entry);
		}
	}

	/**
	 * Checks if there are no entries associated with a guild
	 * @param {Guild|string} guild - The guild or guild ID to check emptiness of
	 * @return {boolean} Whether or not there are no entries associated with the guild
	 */
	isEmpty(guild) {
		if(!guild) throw new Error('A guild must be specified.');
		if(!this.guildsMap) this.loadStorage();
		if(guild.id) guild = guild.id;
		return !this.guildsMap[guild] || this.guildsMap[guild].length === 0;
	}
}
