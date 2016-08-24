'use babel';
'use strict';

import Storage from './storage';
import Util from '../bot/util';

export default class AllowedChannelStorage extends Storage {
	constructor(localStorage, logger) {
		super('allowed-channels', localStorage, logger);
	}

	save(channel) {
		return super.save(channel.guild, channel.id);
	}

	delete(channel) {
		return super.delete(channel.guild, channel.id);
	}

	find(guild, searchString = null) {
		if(!guild) throw new Error('A guild must be specified.');
		if(!this.guildsMap) this.loadStorage();
		if(!this.guildsMap[guild.id]) return [];

		// Find all of the guild's channels that match, and filter them to ones that are usable channels
		const channels = Util.search(guild.channels.getAll('type', 'text'), searchString, { searchExact: false }).filter(channel => this.guildsMap[guild.id].includes(channel.id));
		return Util.search(channels, searchString, { searchInexact: false });
	}
}
