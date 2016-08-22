'use babel';
'use strict';

/**
 * Contains methods to test whether a user has permissions in a server
 */
export default class BotPermissions {
	/**
	 * @param {Client} client - The Discord.js Client to use
	 * @param {ModRoleStorage} modRoles - The mod role storage to use
	 * @param {SettingStorage} settings - The setting storage to use
	 * @param {BotConfig} config - The bot config to use
	 */
	constructor(client, modRoles, settings, config) {
		if(!client || !modRoles || !settings || !config) throw new Error('A client, modRoles, settings, and config must be specified.');

		/** @type {Client} */
		this.client = client;
		/** @type {ModRoleStorage} */
		this.modRoles = modRoles;
		/** @type {SettingStorage} */
		this.settings = settings;
		/** @type {BotConfig} */
		this.config = config;
	}

	/**
	 * @param {Server|string} server - The Discord.js Server instance or a Discord server ID
	 * @param {User|string} user - The Discord.js User instance or a Discord user ID
	 * @return {boolean} Whether or not the user is considered a moderator
	 * @see {@link Permissions.isMod}
	 */
	isMod(server, user) {
		return this.constructor.isMod(this.client, this.modRoles, this.settings, this.config, server, user);
	}

	/**
	 * Tests to see if a user is a moderator on a server using a specified client and config.
	 * If the server has not set any moderator roles, then they will be a moderator if any of their assigned roles contain the "Manage messages" permission.
	 * If the server has set moderator roles, then they will be a moderator if they have any of the moderator roles assigned.
	 * The bot owner and users with the "Administrate" permission are always moderators.
	 * @param {Client} client - The Discord.js Client to use
	 * @param {ModRoleStorage} modRoles - The mod role storage to use
	 * @param {SettingStorage} settings - The setting storage to use
	 * @param {BotConfig} config - The bot config to use
	 * @param {Server|string} server - The Discord.js Server instance or a Discord server ID
	 * @param {User|string} user - The Discord.js User instance or a Discord user ID
	 * @return {boolean} Whether or not the user is considered a moderator
	 * @see {@link Permissions#isMod}
	 */
	static isMod(client, modRoles, settings, config, server, user) {
		[server, user] = this.resolve(client, server, user);
		if(user.id === config.values.owner) return true;
		const userRoles = server.rolesOfUser(user);
		if(userRoles.some(role => role.hasPermission('administrator'))) return true;
		if(!settings.getValue(server, 'mod-mod-roles', true) || modRoles.isEmpty(server)) return userRoles.some(role => role.hasPermission('manageMessages'));
		return modRoles.find(server).some(role => userRoles.some(role2 => role.id === role2.id));
	}

	/**
	 * @param {Server|string} server - The Discord.js Server instance or a Discord server ID
	 * @param {User|string} user - The Discord.js User instance or a Discord user ID
	 * @return {boolean} Whether or not the user is considered an administrator
	 * @see {@link Permissions.isAdmin}
	 */
	isAdmin(server, user) {
		return this.constructor.isAdmin(this.client, this.config, server, user);
	}

	/**
	 * Tests to see if a user is an administrator on a server with a specified client.
	 * If the user is the bot owner or has any roles assigned with the "Administrate" permission, they are considered an administrator.
	 * @param {Client} client - The Discord.js Client to use
	 * @param {BotConfig} config - The bot config to use
	 * @param {Server|string} server - The Discord.js Server instance or a Discord server ID
	 * @param {User|string} user - The Discord.js User instance or a Discord user ID
	 * @return {boolean} Whether or not the user is considered an administrator
	 * @see {@link Permissions#isAdmin}
	 */
	static isAdmin(client, config, server, user) {
		[server, user] = this.resolve(client, server, user);
		if(user.id === config.values.owner) return true;
		return server.rolesOfUser(user).some(role => role.hasPermission('administrator'));
	}

	/**
	 * @param {Server|string} server - The Discord.js Server instance or a Discord server ID
	 * @param {User|string} user - The Discord.js User instance or a Discord user ID
	 * @return {[server, user]} The Server and User instance pair
	 * @see {@link Permissions.resolve}
	 */
	resolve(server, user) {
		if(!server || !user) throw new Error('A server and user must be specified.');
		return this.constructor.resolve(this.client, server, user);
	}

	/**
	 * Resolves a server and user to Discord.js instances with a specified client
	 * @param {Client} client - The Discord.js Client to use
	 * @param {Server|string} server - The Discord.js Server instance or a Discord server ID
	 * @param {User|string} user - The Discord.js User instance or a Discord user ID
	 * @return {[server, user]} The Server and User instance pair
	 * @see {@link Permissions#resolve}
	 */
	static resolve(client, server, user) {
		if(!client || !server || !user) throw new Error('A client, server, and user must be specified.');
		if(typeof server === 'string') server = client.servers.get('id', server);
		if(!server || !server.id) throw new Error('Unable to identify server.');
		if(typeof user === 'string') user = server.members.get('id', user);
		if(!user || !user.id) throw new Error('Unable to identify user.');
		return [server, user];
	}
}
