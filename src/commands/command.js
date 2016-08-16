'use babel';
'use strict';

export default class Command {
	constructor() {
		if(new.target === Command) throw new Error('The base command class may not be instantiated.');
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
}
