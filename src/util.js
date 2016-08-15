'use babel';
'use strict';

import escapeRegex from 'escape-string-regexp';
import request from 'request';
import semver from 'semver';
import bot from '.';
import config from './config';
import Setting from './database/setting';

const nbsp = '\xa0';
const spacePattern = / /g;
const patterns = {
	userID: /^(?:<@!?)?([0-9]+)>?$/,
	roleID: /^(?:<@&)?([0-9]+)>?$/,
	channelID: /^(?:<#)?([0-9]+)>?$/
};

export default class Util {
	/**
	 * Build a command usage string
	 * @param {string} command - The short command string (ex. "roll d20")
	 * @param {?Server} [server=null] - The Discord.js Server instance of the server to use the prefix of
	 * @param {boolean} [onlyMention=false] - Whether or not the usage string should only show the mention form
	 * @return {string} The command usage string
	 */
	static usage(command, server = null, onlyMention = false) {
		const nbcmd = this.nbsp(command);
		if(!server && !onlyMention) return `\`${nbcmd}\``;
		let prefixAddon;
		if(!onlyMention) {
			let prefix = this.nbsp(Setting.getValue('command-prefix', config.commandPrefix, server));
			if(prefix.length > 1) prefix += '\xa0';
			prefixAddon = prefix ? `\`${prefix}${nbcmd}\` or ` : '';
		}
		return `${prefixAddon ? prefixAddon : ''}\`@${this.nbsp(bot.client.user.name)}#${bot.client.user.discriminator}\xa0${nbcmd}\``;
	}

	/**
	 * Build a disambiguation list - useful for telling a user to be more specific when finding partial matches from a command
	 * @param {Object[]} items - An array of items to make the disambiguation list for
	 * @param {string} label - The text to refer to the items as (ex. "characters")
	 * @param {string} [property=name] - The property on items to display in the list
	 * @return {string} The disambiguation list
	 */
	static disambiguation(items, label, property = 'name') {
		const itemList = items.map(item => `"${this.nbsp(property ? item[property] : item)}"`).join(',   ');
		return `Multiple ${label} found, please be more specific: ${itemList}`;
	}

	/**
	 * Paginate an array of items
	 * @param {Object[]} items - An array of items to paginate
	 * @param {number} [page=1] - The page to select
	 * @param {number} [pageLength=10] - The number of items per page
	 * @return {Object} The resulting paginated object
	 * @property {Object[]} items - The chunk of items for the current page
	 * @property {number} page - The current page
	 * @property {number} maxPage - The maximum page
	 * @property {number} pageLength - The numer of items per page
	 * @property {string} pageText - The current page string ("page x of y")
	 */
	static paginate(items, page = 1, pageLength = 10) {
		const maxPage = Math.ceil(items.length / pageLength);
		if(page < 1) page = 1;
		if(page > maxPage) page = maxPage;
		let startIndex = (page - 1) * pageLength;
		return {
			items: items.length > pageLength ? items.slice(startIndex, startIndex + pageLength) : items,
			page: page,
			maxPage: maxPage,
			pageLength: pageLength,
			pageText: `page ${page} of ${maxPage}`
		};
	}

	/**
	 * Search for matches in a list of items
	 * @param {Object[]} items - An array of items to search in
	 * @param {string} searchString - The string to search for
	 * @param {Object} options - An options object
	 * @param {string} [options.property=name] - The property on items to search against
	 * @param {boolean} [options.searchInexact=true] - Whether or not to search for inexact matches
	 * @param {boolean} [options.searchExact=true] - Whether or not to search for exact matches (will narrow down inexact matches if applicable)
	 * @param {boolean} [options.useStartsWith=false] - Whether or not to search inexact by checking to see if the item starts with the search string rather than contains
	 * @return {Object[]} The matched items
	 */
	static search(items, searchString, { property = 'name', searchInexact = true, searchExact = true, useStartsWith = false } = {}) {
		if(!items || items.length === 0) return [];
		if(!searchString) return items;

		const lowercaseSearch = searchString.toLowerCase();
		let matchedItems;

		// Find all items that start with or include the search string
		if(searchInexact) {
			if(useStartsWith && searchString.length === 1) {
				matchedItems = items.filter(element => String(property ? element[property] : element)
					.normalize('NFKD')
					.toLowerCase()
					.startsWith(lowercaseSearch)
				);
			} else {
				matchedItems = items.filter(element => String(property ? element[property] : element)
					.normalize('NFKD')
					.toLowerCase()
					.includes(lowercaseSearch)
				);
			}
		} else {
			matchedItems = items;
		}

		// See if any are an exact match
		if(searchExact && matchedItems.length > 1) {
			const exactItems = matchedItems.filter(element => String(property ? element[property] : element).normalize('NFKD').toLowerCase() === lowercaseSearch);
			if(exactItems.length > 0) return exactItems;
		}

		return matchedItems;
	}

	/**
	 * Splits a string using specified characters into multiple strings of a maximum length
	 * @param {string} text - The string to split
	 * @param {number} [maxLength=1925] - The maximum length of each split string
	 * @param {string} [splitOn=\n] - The characters to split the string with
	 * @return {string[]} The split strings
	 */
	static split(text, maxLength = 1925, splitOn = '\n') {
		const splitText = text.split(splitOn);
		if(splitText.length === 1 && text.length > maxLength) throw new Error('Message exceeds the max length and contains no split characters.');
		const messages = [''];
		let msg = 0;
		for(let i = 0; i < splitText.length; i++) {
			if(messages[msg].length + splitText[i].length + 1 > maxLength) {
				messages.push('');
				msg++;
			}
			messages[msg] += (messages[msg].length > 0 ? '\n' : '') + splitText[i];
		}
		return messages;
	}

	/**
	 * Convert spaces to non-breaking spaces
	 * @param {string} text - The text to convert
	 * @return {string} The converted text
	 */
	static nbsp(text) {
		return String(text).replace(spacePattern, nbsp);
	}

	/**
	 * Useful pattern constants
	 * @type {Object}
	 */
	static get patterns() {
		return patterns;
	}

	/**
	 * Creates a regular expression to match the command prefix and name in a message
	 * @param {?Server} server - A Discord.js Server instance of the server that the message is from
	 * @param {User} user - The Discord.js User instance of the bot
	 * @return {RegExp} Regular expression that matches a command prefix and name
	 */
	static _buildCommandPattern(server, user) {
		let prefix = server ? Setting.getValue('command-prefix', config.commandPrefix, server) : config.commandPrefix;
		if(prefix === 'none') prefix = '';
		const escapedPrefix = escapeRegex(prefix);
		const prefixPatternPiece = prefix ? `${escapedPrefix}\\s*|` : '';
		const pattern = new RegExp(`^(${prefixPatternPiece}<@!?${user.id}>\\s+(?:${escapedPrefix})?)([^\\s]+)`, 'i');
		bot.logger.info(`Server command pattern built.`, { server: server ? server.name : null, serverID: server ? server.id : null, prefix: prefix, pattern: pattern.source });
		return pattern;
	}

	/**
	 * Checks for an update for the bot
	 * @return {void}
	 */
	static _checkForUpdate() {
		request(config.updatePackageURL, (error, response, body) => {
			if(error) {
				bot.logger.warn('Error while checking for update', error);
				return;
			}
			if(response.statusCode !== 200) {
				bot.logger.warn('Error while checking for update', { statusCode: response.statusCode });
				return;
			}

			const masterVersion = JSON.parse(body).version;
			if(!semver.gt(masterVersion, config.botVersion)) return;
			const message = `An update for ${config.botName} is available! Current version is ${config.botVersion}, latest available is ${masterVersion}.`;
			bot.logger.warn(message);
			const savedVersion = Setting.getValue('notified-version');
			if(savedVersion !== masterVersion && bot.client && config.owner) {
				bot.client.sendMessage(config.owner, message);
				Setting.save(new Setting(null, 'notified-version', masterVersion));
			}
		});
	}
}
