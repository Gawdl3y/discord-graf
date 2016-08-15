'use babel';
'use strict';

import FriendlyError from './friendly';
import Util from '../util';

export default class CommandFormatError extends FriendlyError {
	constructor(command, server = null) {
		super(`Invalid command format. Use ${Util.usage(`help ${command.name}`, server)} for information.`);
		this.name = 'CommandFormatError';
	}
}
