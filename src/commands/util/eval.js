'use babel';
'use strict';

/* eslint-disable no-unused-vars */
import util from 'util';
import * as tags from 'common-tags';
import escapeRegex from 'escape-string-regexp';
import * as graf from '../..';
import Command from '../command';
import FriendlyError from '../../errors/friendly';
import CommandFormatError from '../../errors/command-format';
/* eslint-enable no-unused-vars */

const nl = '!!NL!!';
const nlPattern = new RegExp(nl, 'g');

export default class EvalCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'eval',
			module: 'util',
			memberName: 'eval',
			description: 'Evaluates input as JavaScript.',
			usage: 'eval <script>',
			details: 'Only the bot owner may use this command.'
		});

		this.lastResult = null;
		this.objects = bot.evalObjects;
	}

	hasPermission(guild, user) {
		return this.bot.permissions.isOwner(user);
	}

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.guild);

		// Make a bunch of helpers
		/* eslint-disable no-unused-vars */
		const msg = message;
		const bot = this.bot;
		const client = message.client;
		const objects = this.objects;
		const doReply = val => {
			if(val instanceof Error) {
				message.reply(`Callback error: \`${val}\``);
			} else {
				const result = this.makeResultMessages(val, process.hrtime(this.hrStart));
				if(Array.isArray(result)) {
					for(const item of result) message.reply(item);
				} else {
					message.reply(result);
				}
			}
		};
		/* eslint-enable no-unused-vars */

		// Run the code and measure its execution time
		let hrDiff;
		try {
			const hrStart = process.hrtime();
			this.lastResult = eval(args[0]);
			hrDiff = process.hrtime(hrStart);
		} catch(err) {
			return `Error while evaluating: \`${err}\``;
		}

		// Prepare for callback time and respond
		this.hrStart = process.hrtime();
		const response = this.makeResultMessages(this.lastResult, hrDiff, args[0]);
		if(this.bot.config.values.selfbot) {
			await message.edit(response[0]);
			if(response.length > 0) return response.slice(1, response.length - 1);
			return null;
		} else {
			return response;
		}
	}

	makeResultMessages(result, hrDiff, input = null) {
		const inspected = util.inspect(result, { depth: 0 })
			.replace(nlPattern, '\n')
			.replace(this.sensitivePattern, '--snip--');
		const split = inspected.split('\n');
		const last = inspected.length - 1;
		const prependPart = inspected[0] !== '{' && inspected[0] !== '[' && inspected[0] !== "'" ? split[0] : inspected[0];
		const appendPart = inspected[last] !== '}' && inspected[last] !== ']' && inspected[last] !== "'" ? split[split.length - 1] : inspected[last];
		const prepend = `\`\`\`javascript\n${prependPart}\n`;
		const append = `\n${appendPart}\n\`\`\``;
		if(input) {
			return this.bot.util.split(tags.stripIndents`
				${this.bot.config.values.selfbot ? `
					*Input*
					\`\`\`javascript
					${input}
					\`\`\``
				: ''}
				*Executed in ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.*
				\`\`\`javascript
				${inspected}
				\`\`\`
			`, 1900, '\n', prepend, append);
		} else {
			return this.bot.util.split(tags.stripIndents`
				*Callback executed after ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.*
				\`\`\`javascript
				${inspected}
				\`\`\`
			`, 1900, '\n', prepend, append);
		}
	}

	get sensitivePattern() {
		if(!this._sensitivePattern) {
			const bot = this.bot;
			let pattern = '';
			if(bot.client.token) pattern += escapeRegex(bot.client.token);
			if(bot.config.values.token) pattern += (pattern.length > 0 ? '|' : '') + escapeRegex(bot.config.values.token);
			this._sensitivePattern = new RegExp(pattern, 'gi');
		}
		return this._sensitivePattern;
	}
}
