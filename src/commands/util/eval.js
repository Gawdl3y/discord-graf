'use babel';
'use strict';

/* eslint-disable no-unused-vars */
import util from 'util';
import * as tags from 'common-tags';
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

		/* eslint-disable no-unused-vars */
		const msg = message;
		const bot = this.bot;
		const client = message.client;
		const objects = this.objects;
		const doReply = val => {
			if(val instanceof Error) {
				message.reply(`Callback error: \`${val}\``);
			} else {
				const inspected = util.inspect(val, { depth: 0 });
				message.reply(tags.stripIndents`
					Callback result:
					\`\`\`javascript
					${inspected.length < 1925 ? inspected : val}
					\`\`\`
				`);
			}
		};
		/* eslint-enable no-unused-vars */

		try {
			this.lastResult = eval(args[0]);
		} catch(err) {
			return `Error while evaluating: \`${err}\``;
		}

		const inspected = util.inspect(this.lastResult, { depth: 0 }).replace(nlPattern, '\n');
		const split = inspected.split('\n');
		const last = inspected.length - 1;
		const prependPart = inspected[0] !== '{' && inspected[0] !== '[' && inspected[0] !== "'" ? split[0] : inspected[0];
		const appendPart = inspected[last] !== '}' && inspected[last] !== ']' && inspected[last] !== "'" ? split[split.length - 1] : inspected[last];
		const prepend = `\`\`\`javascript\n${prependPart}\n`;
		const append = `\n${appendPart}\n\`\`\``;
		return this.bot.util.split(tags.stripIndents`
			Result:
			\`\`\`javascript
			${inspected}
			\`\`\`
		`, 1900, '\n', prepend, append);
	}
}
