'use babel';
'use strict';

import Setting from '../data/models/setting';

export default class Command {
	constructor(bot, info) { // eslint-disable-line complexity
		if(new.target === Command) throw new Error('The base command class may not be instantiated.');
		if(!bot) throw new Error('A bot must be specified.');
		if(!info) throw new Error('Command info must be specified.');
		if(!info.name) throw new Error('Command must have a name specified.');
		if(info.aliases && !Array.isArray(info.aliases)) throw new TypeError('Command aliases must be an array.');
		if(!info.module) throw new Error('Command must have a module specified.');
		if(!info.memberName) throw new Error('Command must have a memberName specified.');
		if(!info.description) throw new Error('Command must have a description specified.');
		if(info.examples && !Array.isArray(info.examples)) throw new TypeError('Command examples must be an array.');
		if(info.argsType && !['single', 'multiple'].includes(info.argsType)) throw new RangeError('Command argsType must be one of "single" or "multiple".');
		if(info.argsType === 'multiple' && info.argsCount && info.argsCount < 2) throw new RangeError('Command argsCount must be at least 2.');
		if(info.patterns && !Array.isArray(info.patterns)) throw new TypeError('Command patterns must be an array.');

		this.bot = bot;
		this.name = info.name;
		this.aliases = info.aliases || null;
		this.module = info.module;
		this.memberName = info.memberName;
		this.description = info.description;
		this.usage = info.usage || null;
		this.details = info.details || null;
		this.examples = info.examples || null;
		this.serverOnly = !!info.serverOnly;
		this.argsType = info.argsType || 'single';
		this.argsCount = info.argsCount || 0;
		this.argsSingleQuotes = 'argsSingleQuotes' in info ? info.argsSingleQuotes : true;
		this.patterns = info.patterns || null;
	}

	hasPermission(server, user) { // eslint-disable-line no-unused-vars
		return true;
	}

	async run(message, args, fromPattern) { // eslint-disable-line no-unused-vars
		throw new Error(`${this.constructor.name} doesn't have a run() method, or called the super.run() method.`);
	}


	setEnabled(server, enabled) {
		this.bot.storage.settings.save(new Setting(server, `cmd-${this.name}`, enabled));
	}

	isEnabled(server) {
		return this.bot.storage.settings.getValue(server, `cmd-${this.name}`, true) && this.bot.storage.settings.getValue(server, `mod-${this.module}`, true);
	}

	isUsable(message = null) {
		if(this.serverOnly && message && !message.server) return false;
		return !message || (this.isEnabled(message.server) && this.hasPermission(message.server, message.author));
	}
}
