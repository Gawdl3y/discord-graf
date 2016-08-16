'use babel';
'use strict';

/**
 * Has a message that can be considered user-friendly
 */
export default class FriendlyError extends Error {
	/**
	 * @param {string} message - The error message
	 */
	constructor(message) {
		super(message);
		this.name = 'FriendlyError';
	}
}
