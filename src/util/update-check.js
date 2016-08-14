'use babel';
'use strict';

import request from 'request';
import semver from 'semver';
import bot from '../';
import config from '../config';
import Setting from '../database/setting';

export default function checkForUpdate() {
	request(config.updatePackageURL, (error, response, body) => {
		if(!error && response.statusCode === 200) {
			const masterVersion = JSON.parse(body).version;
			if(semver.gt(masterVersion, config.botVersion)) {
				const message = `An update for ${config.botName} is available! Current version is ${config.botVersion}, latest available is ${masterVersion}.`;
				bot.logger.warn(message);
				const savedVersion = Setting.getValue('notified-version');
				if(savedVersion !== masterVersion && bot.client && config.owner) {
					bot.client.sendMessage(config.owner, message);
					Setting.save(new Setting(null, 'notified-version', masterVersion));
				}
			}
		}
	});
}
