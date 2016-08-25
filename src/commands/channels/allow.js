'use babel';
'use strict';

import Command from '../command';
import CommandFormatError from '../../errors/command-format';

export default class AllowChannelCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'allow-channel',
			aliases: ['allow-chan'],
			module: 'channels',
			memberName: 'allow',
			description: 'Allows command operation in a channel.',
			usage: 'allow-channel <channel>',
			details: 'The channel must be the name or ID of a channel, or a channel mention. Only administrators may use this command.',
			examples: ['allow-channel #CoolChannel', 'allow-channel cool', 'allow-channel 205536402341888001'],
			guildOnly: true
		});
	}

	hasPermission(guild, user) {
		return this.bot.permissions.isAdmin(guild, user);
	}

	async run(message, args) {
		if(!args[0]) throw new CommandFormatError(this, message.guild);
		const matches = this.bot.util.patterns.channelID.exec(args[0]);
		const idChannel = matches ? message.guild.channels.get(matches[1]) : null;
		const channels = idChannel ? [idChannel] : this.bot.util.search(message.guild.channels.getAll('type', 'text'), args[0]);

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
