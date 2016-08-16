'use babel';
'use strict';

export default class Setting {
	constructor(server, key, value) {
		if(!key) throw new Error('Setting key must be specified.');
		this.server = server ? server.id ? server.id : server : 'global';
		this.key = key;
		this.value = value;
	}
}
