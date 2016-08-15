'use babel';
'use strict';

/* eslint-disable no-unused-vars */
import util from 'util';
import stringArgv from 'string-argv';
import * as bot from '../..';
import config from '../../config';
import version from '../../version';
import * as registry from '../registry';
import * as dispatcher from '../dispatcher';
import Setting from '../../database/setting';
import ModRole from '../../database/mod-role';
import FriendlyError from '../../errors/friendly';
import CommandFormatError from '../../errors/command-format';
import Util from '../../util';
/* eslint-enable no-unused-vars */

let lastResult;

export default {
	name: 'eval',
	group: 'general',
	groupName: 'eval',
	description: 'Evaluates input as JavaScript.',
	usage: 'eval <script>',
	details: 'Only the bot owner may use this command.',

	isRunnable(message) {
		return message.author.id === config.owner;
	},

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.server);
		const msg = message; // eslint-disable-line no-unused-vars
		try {
			lastResult = eval(args[0]);
			return `Result: \`${util.inspect(lastResult, { depth: 0 })}\``;
		} catch(err) {
			return `Error while evaluating: ${err}`;
		}
	}
};
