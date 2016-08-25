'use babel';
'use strict';

import GuildStorage from '.';
import Util from '../bot/util';

/** Stores roles that are moderators within a guild */
export default class ModRoleStorage extends GuildStorage {
	/**
	 * @param {LocalStorage} localStorage - The LocalStorage instance to use
	 * @param {Logger} [logger] - The logger to use
	 */
	constructor(localStorage, logger) {
		super('mod-roles', localStorage, logger);
	}

	/**
	 * Saves a role to the storage
	 * @param {Role} role - The role to save
	 * @return {boolean} Whether or not the role was saved
	 * @see {@link GuildStorage#save}
	 */
	save(role) {
		return super.save(role.guild, role.id);
	}

	/**
	 * Deletes a role from the storage
	 * @param {Role} role - The role to delete
	 * @return {boolean} Whether or not the role was deleted
	 * @see {@link GuildStorage#delete}
	 */
	delete(role) {
		return super.delete(role.guild, role.id);
	}

	/**
	 * Finds all roles associated with a guild that optionally match a search string
	 * @param {Guild|string} guild - The guild or guild ID to find the roles of
	 * @param {string} [searchString] - The string to match roles against
	 * @return {Role[]} - All found roles
	 * @see {@link GuildStorage#find}
	 */
	find(guild, searchString = null) {
		if(!guild) throw new Error('A guild must be specified.');
		if(!this.guildsMap) this.loadStorage();
		if(!this.guildsMap[guild.id]) return [];

		// Find all of the guild's roles that match, and filter them to ones that are mod roles
		const roles = Util.search(guild.roles.array(), searchString, { searchExact: false }).filter(role => this.guildsMap[guild.id].includes(role.id));
		return Util.search(roles, searchString, { searchInexact: false });
	}
}
