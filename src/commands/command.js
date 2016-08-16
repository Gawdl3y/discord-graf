'use babel';
'use strict';

export default class Command {
	constructor(bot) {
		if(new.target === Command) throw new Error('The base command class may not be instantiated.');
		if(!bot) throw new Error('A bot must be specified.');
		this.bot = bot;
		this.name = null;
		this.aliases = null;
		this.group = null;
		this.groupName = null;
		this.description = null;
		this.usage = null;
		this.details = null;
		this.examples = null;
		this.serverOnly = false;
		this.argsType = 'single';
		this.argsCount = 0;
	}

	isRunnable() {
		return true;
	}

	async run() {
		return {};
	}
}
