'use babel';
'use strict';

import Util from '../util';

export default class Storage {
	constructor(key, localStorage, logger) {
		if(!key || !localStorage) throw new Error('A key and localStorage must be specified.');
		this.key = key;
		this.localStorage = localStorage;
		this.logger = logger;
	}

	loadStorage() {
		this.serversMap = JSON.parse(this.localStorage.getItem(this.key));
		if(!this.serversMap) this.serversMap = {};
	}

	saveStorage() {
		if(this.logger) this.logger.debug('Saving mod roles storage...', this.serversMap);
		this.localStorage.setItem('mod-roles', JSON.stringify(this.serversMap));
	}

	save(server, entry, searchFunction = null) {
		if(!server || !entry) throw new Error('A server and entry must be specified.');
		if(!this.serversMap) this.loadStorage();
		if(server.id) server = server.id;
		if(!this.serversMap[server]) this.serversMap[server] = [];

		const exists = searchFunction ? this.serversMap[server].some(searchFunction) : this.serversMap[server].includes(entry);
		if(!exists) {
			this.serversMap[server].push(entry);
			this.saveStorage();
			if(this.logger) this.logger.verbose(`Added new entry to ${this.key} storage.`, entry);
			return true;
		} else {
			if(this.logger) this.logger.verbose(`Not adding entry to ${this.key} storage, because it already exists.`, entry);
			return false;
		}
	}

	delete(server, entry, searchFunction = null) {
		if(!server || !entry) throw new Error('A server and entry must be specified.');
		if(!this.serversMap) this.loadStorage();
		if(server.id) server = server.id;
		if(!this.serversMap[server]) this.serversMap[server] = [];

		const index = searchFunction ? this.serversMap[server].findIndex(searchFunction) : this.serversMap[server].findIndex(item => item === entry);
		if(index >= 0) {
			this.serversMap[server].splice(index, 1);
			this.saveStorage();
			if(this.logger) this.logger.info(`Deleted entry from ${this.key} storage.`, entry);
			return true;
		} else {
			if(this.logger) this.logger.info(`Not deleting entry from ${this.key} storage, because it doesn\'t exist.`, entry);
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
		return Util.search(this.serversMap[server], searchString, searchOptions);
	}

	exists(server, entry, searchFunction = null) {
		if(!server || !entry) throw new Error('A server and entry must be specified.');
		if(!this.serversMap) this.loadStorage();
		if(server.id) server = server.id;
		if(!this.serversMap[server]) return false;
		return searchFunction ? this.serversMap[server].some(searchFunction) : this.serversMap[server].includes(entry);
	}

	isEmpty(server) {
		if(!server) throw new Error('A server must be specified.');
		if(!this.serversMap) this.loadStorage();
		if(server.id) server = server.id;
		return !this.serversMap[server] || this.serversMap[server].length === 0;
	}
}
