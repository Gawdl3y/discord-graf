'use babel';
'use strict';

/** Contains general utility methods */
export default class BotUtil {
	/**
	 * @param {Client} client - The client to use
	 * @param {SettingStorage} settings - The setting storage to use
	 * @param {BotConfig} config - The bot config to use
	 */
	constructor(client, settings, config) {
		if(!client || !settings || !config) throw new Error('A client, settings, and config must be specified.');

		/** @type {Client} */
		this.client = client;
		/** @type {SettingStorage} */
		this.settings = settings;
		/** @type {BotConfig} */
		this.config = config;
		/**
		 * @type {PatternConstants}
		 * @see {@link Util.patterns}
		 */
		this.patterns = patterns;
	}

	/**
	 * @param {string} command - The short command string (ex. "roll d20")
	 * @param {Guild|string} [guild] - The guild or guild ID to use the prefix of
	 * @param {boolean} [onlyMention=false] - Whether or not the usage string should only show the mention form
	 * @return {string} The command usage string
	 * @see {@link Util.usage}
	 */
	usage(command, guild = null, onlyMention = false) {
		return this.constructor.usage(this.client, this.settings, this.config, command, guild, onlyMention);
	}

	/**
	 * Build a command usage string
	 * @param {Client} client - The client to use
	 * @param {SettingStorage} settings - The setting storage to use
	 * @param {BotConfig} config - The bot config to use
	 * @param {string} command - The short command string (ex. "roll d20")
	 * @param {Guild|string} [guild] - The guild or guild ID to use the prefix of
	 * @param {boolean} [onlyMention=false] - Whether or not the usage string should only show the mention form
	 * @return {string} The command usage string
	 * @see {@link Util#usage}
	 */
	static usage(client, settings, config, command, guild = null, onlyMention = false) {
		const nbcmd = this.nbsp(command);
		if(!guild && !onlyMention) return `\`${nbcmd}\``;
		let prefixAddon;
		if(!onlyMention) {
			let prefix = this.nbsp(settings.getValue(guild, 'command-prefix', config.values.commandPrefix));
			if(prefix.length > 1) prefix += '\xa0';
			prefixAddon = prefix ? `\`${prefix}${nbcmd}\` or ` : '';
		}
		return `${prefixAddon || ''}\`@${this.nbsp(client.user.username)}#${client.user.discriminator}\xa0${nbcmd}\``;
	}

	/**
	 * @param {Object[]} items - An array of items to make the disambiguation list for
	 * @param {string} label - The text to refer to the items as (ex. "characters")
	 * @param {string} [property=name] - The property on items to display in the list
	 * @return {string} The disambiguation list
	 * @see {@link Util.disambiguation}
	 */
	disambiguation(items, label, property = 'name') {
		return this.constructor.disambiguation(items, label, property);
	}

	/**
	 * Build a disambiguation list - useful for telling a user to be more specific when finding partial matches from a command
	 * @param {Object[]} items - An array of items to make the disambiguation list for
	 * @param {string} label - The text to refer to the items as (ex. "characters")
	 * @param {string} [property=name] - The property on items to display in the list
	 * @return {string} The disambiguation list
	 * @see {@link Util#disambiguation}
	 */
	static disambiguation(items, label, property = 'name') {
		const itemList = items.map(item => `"${this.nbsp(property ? item[property] : item)}"`).join(',   ');
		return `Multiple ${label} found, please be more specific: ${itemList}`;
	}

	/**
	 * @param {Object[]} items - An array of items to paginate
	 * @param {number} [page=1] - The page to select
	 * @param {number} [pageLength=10] - The number of items per page
	 * @return {Object} The resulting paginated object
	 * @property {Object[]} items - The chunk of items for the current page
	 * @property {number} page - The current page
	 * @property {number} maxPage - The maximum page
	 * @property {number} pageLength - The numer of items per page
	 * @property {string} pageText - The current page string ("page x of y")
	 * @see {@link Util.paginate}
	 */
	paginate(items, page = 1, pageLength = 10) {
		return this.constructor.paginate(items, page, pageLength);
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
	 * @see {@link Util#paginate}
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
	 * @param {Object[]} items - An array of items to search in
	 * @param {string} searchString - The string to search for
	 * @param {SearchOptions} options - An options object
	 * @return {Object[]} The matched items
	 * @see {@link Util.search}
	 */
	search(items, searchString, { property = 'name', searchInexact = true, searchExact = true, useStartsWith = false } = {}) {
		return this.constructor.search(items, searchString, { property: property, searchInexact: searchInexact, searchExact: searchExact, useStartsWith: useStartsWith });
	}

	/**
	 * Search for matches in a list of items
	 * @param {Object[]} items - An array of items to search in
	 * @param {string} searchString - The string to search for
	 * @param {SearchOptions} options - An options object
	 * @return {Object[]} The matched items
	 * @see {@link Util#search}
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
	 * @param {string} text - The string to split
	 * @param {number} [maxLength=1925] - The maximum length of each split string
	 * @param {string} [splitOn=\n] - The characters to split the string with
	 * @param {string} [prepend] - String to prepend to every split message
	 * @param {string} [append] - String to append to every split message
	 * @return {string[]} The split strings
	 * @see {@link Util.split}
	 */
	split(text, maxLength = 1925, splitOn = '\n', prepend = '', append = '') {
		return this.constructor.split(text, maxLength, splitOn, prepend, append);
	}

	/**
	 * Splits a string using specified characters into multiple strings of a maximum length
	 * @param {string} text - The string to split
	 * @param {number} [maxLength=1925] - The maximum length of each split string
	 * @param {string} [splitOn=\n] - The characters to split the string with
	 * @param {string} [prepend] - String to prepend to every split message
	 * @param {string} [append] - String to append to every split message
	 * @return {string[]} The split strings
	 * @see {@link Util#split}
	 */
	static split(text, maxLength = 1900, splitOn = '\n', prepend = '', append = '') {
		const splitText = text.split(splitOn);
		if(splitText.length === 1 && text.length > maxLength) throw new Error('Message exceeds the max length and contains no split characters.');
		const messages = [''];
		let msg = 0;
		for(let i = 0; i < splitText.length; i++) {
			if(messages[msg].length + splitText[i].length + 1 > maxLength) {
				messages[msg] += append;
				messages.push(prepend);
				msg++;
			}
			messages[msg] += (messages[msg].length > 0 && messages[msg] !== prepend ? splitOn : '') + splitText[i];
		}
		return messages;
	}

	/**
	 * @param {string} text - The text to convert
	 * @return {string} The converted text
	 * @see {@link Util#nbsp}
	 */
	nbsp(text) {
		return this.constructor.nbsp(text);
	}

	/**
	 * Convert spaces to non-breaking spaces
	 * @param {string} text - The text to convert
	 * @return {string} The converted text
	 * @see {@link Util#nbsp}
	 */
	static nbsp(text) {
		return String(text).replace(spacePattern, nbsp);
	}

	/**
	 * @type {PatternConstants}
	 * @see {@link Util#patterns}
	 */
	static get patterns() {
		return patterns;
	}
}

const nbsp = '\xa0';
const spacePattern = / /g;

/**
 * @typedef {Object} PatternConstants
 * @property {RegExp} userID - A pattern to match a user ID from a raw ID string or mention
 * @property {RegExp} roleID - A pattern to match a role ID from a raw ID string or mention
 * @property {RegExp} channelID - A pattern to match a channel ID from a raw ID string or mention
 * @property {RegExp} allUserMentions - A pattern to to match any mentions that would notify users
 */
const patterns = {
	userID: /^(?:<@!?)?([0-9]+)>?$/,
	roleID: /^(?:<@&)?([0-9]+)>?$/,
	channelID: /^(?:<#)?([0-9]+)>?$/,
	anyUserMentions: /@everyone|@here|<@(?:!|&)?[0-9]+>/i
};

/**
 * @typedef {Object} SearchOptions
 * @property {string} [property=name] - The property on items to search against. If empty, the raw object's toString will be used instead.
 * @property {boolean} [searchInexact=true] - Whether or not to search for inexact matches
 * @property {boolean} [searchExact=true] - Whether or not to search for exact matches (will narrow down inexact matches if applicable)
 * @property {boolean} [useStartsWith=false] - Whether or not to search inexact by checking to see if the item starts with the search string rather than contains,
 * if the search string is only one character
 */
