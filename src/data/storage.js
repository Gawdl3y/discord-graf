'use babel';
'use strict';

import Util from '../bot/util';

export default class Storage {
	constructor(key, localStorage, logger, objectBased = false) {
		if(!key || !localStorage) throw new Error('A key and localStorage must be specified.');
		this.key = key;
		this.localStorage = localStorage;
		this.logger = logger;
		this.objectBased = objectBased;
	}

	loadStorage() {
		this.guildsMap = JSON.parse(this.localStorage.getItem(this.key));
		if(!this.guildsMap) this.guildsMap = {};
	}

	saveStorage() {
		this.localStorage.setItem(this.key, JSON.stringify(this.guildsMap));
		if(this.logger) this.logger.debug(`Saved ${this.key} storage.`, this.guildsMap);
	}

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
				index = entry.key ? entry.key : entry;
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

	clear(guild) {
		if(!guild) throw new Error('A guild must be specified.');
		if(!this.guildsMap) this.loadStorage();
		delete this.guildsMap[guild.id ? guild.id : guild];
		if(this.logger) this.logger.info(`Cleared a guild in ${this.key} storage.`, { guild: guild.id ? guild.id : guild });
		this.saveStorage();
	}

	clearAll() {
		if(!this.guildsMap) this.loadStorage();
		for(const key of Object.keys(this.guildsMap)) delete this.guildsMap[key];
		if(this.logger) this.logger.info(`Cleared all of ${this.key} storage.`);
		this.saveStorage();
	}

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

	exists(guild, entry, searchFunction = null) {
		if(!guild || !entry) throw new Error('A guild and entry must be specified.');
		if(!this.guildsMap) this.loadStorage();
		if(guild.id) guild = guild.id;
		if(!this.guildsMap[guild]) return false;
		if(this.objectBased) {
			if(searchFunction) {
				for(const entryKey of Object.keys(this.guildsMap)) {
					if(searchFunction(entryKey, this.guildsMap[guild][entryKey])) return true;
				}
				return false;
			} else {
				return typeof this.guildsMap[guild][entry.key ? entry.key : entry] !== 'undefined';
			}
		} else {
			return searchFunction ? this.guildsMap[guild].some(searchFunction) : this.guildsMap[guild].includes(entry);
		}
	}

	isEmpty(guild) {
		if(!guild) throw new Error('A guild must be specified.');
		if(!this.guildsMap) this.loadStorage();
		if(guild.id) guild = guild.id;
		return !this.guildsMap[guild] || this.guildsMap[guild].length === 0;
	}
}
