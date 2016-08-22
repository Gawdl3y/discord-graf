'use babel';
'use strict';

import { stripIndents } from 'common-tags';
import Command from '../command';

export default class ListAllowedChannelsCommand extends Command {
	constructor(bot) {
		super(bot);
		this.name = 'allowedchannels';
		this.aliases = ['allowedchans', 'channels', 'chans'];
		this.module = 'channels';
		this.memberName = 'list-allowed';
		this.description = 'Lists all channels command operation is allowed in.';
		this.serverOnly = true;
	}

	async run(message) {
		const channels = this.bot.storage.allowedChannels.find(message.server);
		if(channels.length > 0) {
			return stripIndents`
				__**Allowed channels:**__
				${channels.map(channel => `**-** ${channel}`).join('\n')}
			`;
		} else {
			return 'There are no channels specifically allowed, therefore operation is allowed in any channel.';
		}
	}
}
