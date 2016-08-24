'use babel';
'use strict';

import GuildStorage from '.';
import Util from '../bot/util';

/** Stores channels that the bot is allowed to operate in within a guild */
export default class AllowedChannelStorage extends GuildStorage {
	/**
	 * @param {LocalStorage} localStorage - The LocalStorage instance to use
	 * @param {Logger} [logger] - The logger to use
	 */
	constructor(localStorage, logger) {
		super('allowed-channels', localStorage, logger);
	}

	/**
	 * Saves a channel to the storage
	 * @param {Channel} channel - The channel to save
	 * @return {boolean} Whether or not the channel was saved
	 * @see {@link GuildStorage#save}
	 */
	save(channel) {
		return super.save(channel.guild, channel.id);
	}

	/**
	 * Deletes a channel from the storage
	 * @param {Channel} channel - The channel to delete
	 * @return {boolean} Whether or not the channel was deleted
	 * @see {@link GuildStorage#delete}
	 */
	delete(channel) {
		return super.delete(channel.guild, channel.id);
	}

	/**
	 * Finds all channels associated with a guild that optionally match a search string
	 * @param {Guild|string} guild - The guild or guild ID to find the channels of
	 * @param {string} [searchString] - The string to match channels against
	 * @return {Channel[]} - All found channels
	 * @see {@link GuildStorage#find}
	 */
	find(guild, searchString = null) {
		if(!guild) throw new Error('A guild must be specified.');
		if(!this.guildsMap) this.loadStorage();
		if(!this.guildsMap[guild.id]) return [];

		// Find all of the guild's channels that match, and filter them to ones that are usable channels
		const channels = Util.search(guild.channels.getAll('type', 'text'), searchString, { searchExact: false }).filter(channel => this.guildsMap[guild.id].includes(channel.id));
		return Util.search(channels, searchString, { searchInexact: false });
	}
}
