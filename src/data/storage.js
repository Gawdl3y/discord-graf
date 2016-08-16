'use babel';
'use strict';

import Util from '../util';

export default class Storage {
	constructor(key, localStorage, logger, objectBased = false) {
		if(!key || !localStorage) throw new Error('A key and localStorage must be specified.');
		this.key = key;
		this.localStorage = localStorage;
		this.logger = logger;
		this.objectBased = objectBased;
	}

	loadStorage() {
		this.serversMap = JSON.parse(this.localStorage.getItem(this.key));
		if(!this.serversMap) this.serversMap = {};
	}

	saveStorage() {
		this.localStorage.setItem(this.key, JSON.stringify(this.serversMap));
		if(this.logger) this.logger.debug(`Saved ${this.key} storage.`, this.serversMap);
	}

	save(server, entry, searchFunction = null) {
		if(!server || !entry) throw new Error('A server and entry must be specified.');
		if(!this.serversMap) this.loadStorage();
		if(server.id) server = server.id;
		if(!this.serversMap[server]) this.serversMap[server] = this.objectBased ? {} : [];

		const exists = this.exists(server, entry, searchFunction);
		if(!exists || this.objectBased) {
			if(this.objectBased) this.serversMap[server][entry.key] = entry.value; else this.serversMap[server].push(entry);
			this.saveStorage();
			if(this.logger) this.logger.verbose(`${exists ? `Updated` : `Added`} entry in ${this.key} storage.`, { server: server, entry: entry });
			return true;
		} else {
			if(this.logger) this.logger.verbose(`Not adding entry to ${this.key} storage, because it already exists.`, { server: server, entry: entry });
			return false;
		}
	}

	delete(server, entry, searchFunction = null) {
		if(!server || !entry) throw new Error('A server and entry must be specified.');
		if(!this.serversMap) this.loadStorage();
		if(server.id) server = server.id;
		if(!this.serversMap[server]) this.serversMap[server] = this.objectBased ? {} : [];

		let index = this.objectBased ? null : -1;
		if(this.objectBased) {
			if(searchFunction) {
				for(const entryKey of Object.keys(this.serversMap)) {
					if(searchFunction(entryKey, this.serversMap[server][entryKey])) {
						index = entryKey;
						break;
					}
				}
			} else {
				index = entry.key ? entry.key : entry;
			}
		} else {
			index = searchFunction ? this.serversMap[server].findIndex(searchFunction) : this.serversMap[server].findIndex(item => item === entry);
		}

		if((this.objectBased && index) || (!this.objectBased && index >= 0)) {
			if(this.objectBased) delete this.serversMap[server][index]; else this.serversMap[server].splice(index, 1);
			this.saveStorage();
			if(this.logger) this.logger.info(`Deleted entry from ${this.key} storage.`, { server: server, entry: entry });
			return true;
		} else {
			if(this.logger) this.logger.info(`Not deleting entry from ${this.key} storage, because it doesn\'t exist.`, { server: server, entry: entry });
			return false;
		}
	}

	clear(server) {
		if(!server) throw new Error('A server must be specified.');
		if(!this.serversMap) this.loadStorage();
		delete this.serversMap[server.id ? server.id : server];
		if(this.logger) this.logger.info(`Cleared a server in ${this.key} storage.`, { server: server.id ? server.id : server });
		this.saveStorage();
	}

	clearAll() {
		if(!this.serversMap) this.loadStorage();
		for(const key of Object.keys(this.serversMap)) delete this.serversMap[key];
		if(this.logger) this.logger.info(`Cleared all of ${this.key} storage.`);
		this.saveStorage();
	}

	find(server, searchString = null, searchOptions = {}) {
		if(!server) throw new Error('A server must be specified.');
		if(!this.serversMap) this.loadStorage();
		if(server.id) server = server.id;
		if(!this.serversMap[server]) return [];
		if(!searchString) return this.serversMap[server];
		if(this.objectBased) {
			if(this.serversMap[server][searchString]) return [this.serversMap[server][searchString]];
			else return [];
		} else {
			return Util.search(this.serversMap[server], searchString, searchOptions);
		}
	}

	exists(server, entry, searchFunction = null) {
		if(!server || !entry) throw new Error('A server and entry must be specified.');
		if(!this.serversMap) this.loadStorage();
		if(server.id) server = server.id;
		if(!this.serversMap[server]) return false;
		if(this.objectBased) {
			if(searchFunction) {
				for(const entryKey of Object.keys(this.serversMap)) {
					if(searchFunction(entryKey, this.serversMap[server][entryKey])) return true;
				}
				return false;
			} else {
				return typeof this.serversMap[server][entry.key ? entry.key : entry] !== 'undefined';
			}
		} else {
			return searchFunction ? this.serversMap[server].some(searchFunction) : this.serversMap[server].includes(entry);
		}
	}

	isEmpty(server) {
		if(!server) throw new Error('A server must be specified.');
		if(!this.serversMap) this.loadStorage();
		if(server.id) server = server.id;
		return !this.serversMap[server] || this.serversMap[server].length === 0;
	}
}
