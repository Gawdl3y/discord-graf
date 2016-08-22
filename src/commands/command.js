'use babel';
'use strict';

import Setting from '../data/models/setting';

export default class Command {
	constructor(bot) {
		if(new.target === Command) throw new Error('The base command class may not be instantiated.');
		if(!bot) throw new Error('A bot must be specified.');

		this.bot = bot;
		this.name = null;
		this.aliases = null;
		this.module = null;
		this.memberName = null;
		this.description = null;
		this.usage = null;
		this.details = null;
		this.examples = null;
		this.serverOnly = false;
		this.argsType = 'single';
		this.argsCount = 0;
		this.argsSingleQuotes = true;
	}

	isRunnable() {
		return true;
	}

	async run() {
		throw new Error(`${this.constructor.name} doesn't have a run() method, or called the super.run() method.`);
	}

	setEnabled(server, enabled) {
		this.bot.storage.settings.save(new Setting(server, `cmd-${this.name}`, enabled));
	}

	isEnabled(server) {
		return this.bot.storage.settings.getValue(server, `cmd-${this.name}`, true) && this.bot.storage.settings.getValue(server, `mod-${this.module}`, true);
	}
}
