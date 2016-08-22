'use babel';
'use strict';

import Storage from './storage';
import Util from '../bot/util';

export default class AllowedChannelStorage extends Storage {
	constructor(localStorage, logger) {
		super('allowed-channels', localStorage, logger);
	}

	save(channel) {
		return super.save(channel.server, channel.id);
	}

	delete(channel) {
		return super.delete(channel.server, channel.id);
	}

	find(server, searchString = null) {
		if(!server) throw new Error('A server must be specified.');
		if(!this.serversMap) this.loadStorage();
		if(!this.serversMap[server.id]) return [];

		// Find all of the server's channels that match, and filter them to ones that are usable channels
		const channels = Util.search(server.channels.getAll('type', 'text'), searchString, { searchExact: false }).filter(channel => this.serversMap[server.id].includes(channel.id));
		return Util.search(channels, searchString, { searchInexact: false });
	}
}
