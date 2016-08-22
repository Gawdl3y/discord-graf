'use babel';
'use strict';

import { version } from '../..';
import { stripIndents } from 'common-tags';
import Command from '../command';

export default class AboutCommand extends Command {
	constructor(bot) {
		super(bot, {
			name: 'about',
			module: 'info',
			memberName: 'about',
			description: 'Displays information about the bot.'
		});
	}

	async run(message) {
		const config = this.bot.config.values;
		const owner = message.client.users.get('id', this.bot.config.values.owner);
		const servers = message.client.servers.length.toLocaleString(), users = message.client.users.length.toLocaleString();
		const serversLabel = servers !== 1 ? 'servers' : 'server', usersLabel = users !== 1 ? 'users' : 'user';
		const uptime = process.uptime();
		const days = Math.floor(uptime / 60 / 60 / 24), hours = Math.floor(uptime / 60 / 60 % 24), minutes = Math.floor(uptime / 60 % 60);
		const daysLabel = days !== 1 ? 'days' : 'day', hoursLabel = hours !== 1 ? 'hours' : 'hour', minutesLabel = minutes !== 1 ? 'minutes' : 'minute';
		const daysStr = `${days.toLocaleString()} ${daysLabel}`, hoursStr = `${hours.toLocaleString()} ${hoursLabel}`, minutesStr = `${minutes.toLocaleString()} ${minutesLabel}`;
		return {
			direct: stripIndents`
				${config.botAbout ? config.botAbout : ''}

				This bot ${owner ? `is owned by ${owner.name}#${owner.discriminator}, and ` : ''}is serving ${users} ${usersLabel} across ${servers} ${serversLabel}.
				It has been running without interruption for ${days > 0 ? `${daysStr} ` : ''}${hours > 0 ? `${hoursStr} ` : ''}${minutesStr}.
				${config.invite ? `For bot feedback/help, use this invite: ${config.invite}` : ''}

				Based on Discord GRAF v${version}: https://github.com/Gawdl3y/discord-graf
			`,
			reply: 'Sent a DM to you with information.'
		};
	}
}
