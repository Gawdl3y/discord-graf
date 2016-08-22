'use babel';
'use strict';

import Setting from '../data/models/setting';

export default class Module {
	constructor(bot, id, name, commands) {
		if(!bot || !id) throw new Error('A bot and ID must be specified.');
		if(commands && !Array.isArray(commands)) throw new TypeError('Commands must be an array.');
		this.bot = bot;
		this.id = id;
		this.name = name || id;
		this.commands = commands || [];
	}

	setEnabled(server, enabled) {
		this.bot.storage.settings.save(new Setting(server, `mod-${this.id}`, enabled));
	}

	isEnabled(server) {
		return this.bot.storage.settings.getValue(server, `mod-${this.id}`, true);
	}
}
