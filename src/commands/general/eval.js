'use babel';
'use strict';

/* eslint-disable no-unused-vars */
import util from 'util';
import * as graf from '../..';
import Command from '../command';
import FriendlyError from '../../errors/friendly';
import CommandFormatError from '../../errors/command-format';
/* eslint-enable no-unused-vars */

export default class EvalCommand extends Command {
	constructor(bot) {
		super(bot);
		this.name = 'eval';
		this.group = 'general';
		this.groupName = 'eval';
		this.description = 'Evaluates input as JavaScript.';
		this.usage = 'eval <script>';
		this.details = 'Only the bot owner may use this command.';

		this.lastResult = null;
		this.objects = bot.evalObjects;
	}

	isRunnable(message) {
		return message.author.id === this.bot.config.values.owner;
	}

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.server);

		/* eslint-disable no-unused-vars */
		const msg = message;
		const bot = this.bot;
		const objects = this.objects;
		const doReply = val => message.reply(`Callback result: \`${util.inspect(val, { depth: 0 })}\``);
		/* eslint-enable no-unused-vars */

		try {
			this.lastResult = eval(args[0]);
			return `Result: \`${util.inspect(this.lastResult, { depth: 0 })}\``;
		} catch(err) {
			return `Error while evaluating: ${err}`;
		}
	}
}
