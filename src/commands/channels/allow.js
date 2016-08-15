'use babel';
'use strict';

import UsableChannel from '../../database/usable-channel';
import * as permissions from '../../permissions';
import CommandFormatError from '../../errors/command-format';
import Util from '../../util';

export default {
	name: 'allowchannel',
	aliases: ['allowchan', 'addchannel', 'addchan'],
	group: 'channels',
	groupName: 'add',
	description: 'Allows command operation in a channel.',
	usage: 'allowchannel <channel>',
	details: 'The channel must be the name or ID of a channel, or a channel mention. Only administrators may use this command.',
	examples: ['allowchannel #CoolChannel', 'allowchannel cool', 'allowchannel 205536402341888001'],
	serverOnly: true,

	isRunnable(message) {
		return permissions.isAdmin(message.server, message.author);
	},

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.server);
		const matches = Util.patterns.channelID.exec(args[0]);
		let channels;
		const idChannel = message.server.channels.get('id', matches[1]);
		if(idChannel) channels = [idChannel]; else channels = Util.search(message.server.channels.getAll('type', 'text'), matches[1]);

		if(channels.length === 1) {
			if(UsableChannel.save(channels[0])) {
				return `Allowed operation in ${channels[0]}.`;
			} else {
				return `Operation is already allowed in ${channels[0]}.`;
			}
		} else if(channels.length > 1) {
			return Util.disambiguation(channels, 'channels');
		} else {
			return 'Unable to identify channel.';
		}
	}
};
