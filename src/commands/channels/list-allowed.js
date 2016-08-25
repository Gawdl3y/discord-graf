'use babel';
'use strict';

import { stripIndents } from 'common-tags';
import Command from '../command';

export default class ListAllowedChannelsCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'allowed-channels',
			aliases: ['list-allowed-channels', 'show-allowed-channels', 'allowed-chans'],
			module: 'channels',
			memberName: 'list-allowed',
			description: 'Lists all channels command operation is allowed in.',
			guildOnly: true
		});
	}

	async run(message) {
		const channels = this.bot.storage.allowedChannels.find(message.guild);
		if(channels.length > 0) {
			return stripIndents`
				__**Allowed channels**__
				${channels.map(channel => `**-** ${channel ? `<#${channel.id}>` : 'Unknown'}`).join('\n')}
			`;
		} else {
			return 'There are no channels specifically allowed, therefore operation is allowed in any channel.';
		}
	}
}
