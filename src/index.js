'use babel';
'use strict';

import { readFileSync } from 'fs';
import { join as pathJoin } from 'path';
import _Bot from './bot';
import _Permissions from './bot/permissions';
import _Util from './bot/util';
import _Command from './commands/command';
import _Module from './commands/module';
import _GuildStorage from './storage';
import _Setting from './storage/models/setting';
import _FriendlyError from './errors/friendly';
import _CommandFormatError from './errors/command-format';

/**
 * The version of GRAF
 * @type {string}
 */
export const version = JSON.parse(readFileSync(pathJoin(__dirname, '../package.json'))).version;

/**
 * The {@link Bot} class
 * @type {function}
 */
export const Bot = _Bot;
export default Bot;

/**
 * The {@link Command} class
 * @type {function}
 */
export const Command = _Command;

/**
 * The {@link Module} class
 * @type {function}
 */
export const Module = _Module;

/**
 * The {@link BotPermissions} class
 * @type {function}
 */
export const Permissions = _Permissions;

/**
 * The {@link BotUtil} class
 * @type {function}
 */
export const Util = _Util;

/**
 * The {@link GuildStorage} class
 * @type {function}
 */
export const GuildStorage = _GuildStorage;

/**
 * The {@link Setting} class
 * @type {function}
 */
export const Setting = _Setting;

/**
 * The {@link FriendlyError} class
 * @type {function}
 */
export const FriendlyError = _FriendlyError;

/**
 * The {@link CommandFormatError} class
 * @type {function}
 */
export const CommandFormatError = _CommandFormatError;

/** @external {Client} http://hydrabolt.github.io/discord.js/index.html#!/docs/tag/master/class/Client */
/** @external {User} http://hydrabolt.github.io/discord.js/index.html#!/docs/tag/master/class/User */
/** @external {Guild} http://hydrabolt.github.io/discord.js/index.html#!/docs/tag/master/class/Guild */
/** @external {Channel} http://hydrabolt.github.io/discord.js/index.html#!/docs/tag/master/class/Channel */
/** @external {Message} http://hydrabolt.github.io/discord.js/index.html#!/docs/tag/master/class/Message */
/** @external {Role} http://hydrabolt.github.io/discord.js/index.html#!/docs/tag/master/class/Role */
/** @external {Logger} https://github.com/winstonjs/winston/blob/master/README.md */
/** @external {LocalStorage} https://developer.mozilla.org/en-US/docs/Web/API/Storage */
