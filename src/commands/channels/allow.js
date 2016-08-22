'use babel';
'use strict';

import Command from '../command';
import CommandFormatError from '../../errors/command-format';

export default class AllowChannelCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'allowchannel',
			aliases: ['allowchan', 'addchannel', 'addchan'],
			module: 'channels',
			memberName: 'allow',
			description: 'Allows command operation in a channel.',
			usage: 'allowchannel <channel>',
			details: 'The channel must be the name or ID of a channel, or a channel mention. Only administrators may use this command.',
			serverOnly: true
		});
	}

	hasPermission(server, user) {
		return this.bot.permissions.isAdmin(server, user);
	}

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.server);
		const matches = this.bot.util.patterns.channelID.exec(args[0]);
		const idChannel = matches ? message.server.channels.get('id', matches[1]) : null;
		const channels = idChannel ? [idChannel] : this.bot.util.search(message.server.channels.getAll('type', 'text'), args[0]);

		if(channels.length === 1) {
			if(this.bot.storage.allowedChannels.save(channels[0])) {
				return `Allowed operation in ${channels[0]}.`;
			} else {
				return `Operation is already allowed in ${channels[0]}.`;
			}
		} else if(channels.length > 1) {
			return this.bot.util.disambiguation(channels, 'channels');
		} else {
			return 'Unable to identify channel.';
		}
	}
}
