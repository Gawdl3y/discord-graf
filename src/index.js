'use babel';
'use strict';

import { readFileSync } from 'fs';
import { join as pathJoin } from 'path';
import _Bot from './bot';
import _Permissions from './bot/permissions';
import _Util from './bot/util';
import _Command from './commands/command';
import _Module from './commands/module';
import _Setting from './data/models/setting';
import _Storage from './data/storage';
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
 * The {@link Storage} class
 * @type {function}
 */
export const Storage = _Storage;

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

/** @external {Client} http://discordjs.readthedocs.io/en/latest/docs_client.html */
/** @external {User} http://discordjs.readthedocs.io/en/latest/docs_user.html */
/** @external {Server} http://discordjs.readthedocs.io/en/latest/docs_server.html */
/** @external {Channel} http://discordjs.readthedocs.io/en/latest/docs_channel.html */
/** @external {Message} http://discordjs.readthedocs.io/en/latest/docs_message.html */
/** @external {Logger} https://github.com/winstonjs/winston/blob/master/README.md */
/** @external {LocalStorage} https://developer.mozilla.org/en-US/docs/Web/API/Storage */
