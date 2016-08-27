## Guild storage
The [`GuildStorage`](../class/src/storage/index.js~GuildStorage.html) class allows you to create storages that associate data with guilds.
You can either directly instantiate the base `GuildStorage` class, or extend it.
There are three built-in storages that every bot has an instance of:
- [`AllowedChannelStorage`](../class/src/storage/allowed-channels.js~AllowedChannelStorage.html) as `bot.storage.allowedChannels`
- [`ModRoleStorage`](../class/src/storage/mod-roles.js~ModRoleStorage.html) as `bot.storage.modRoles`
- [`SettingStorage`](../class/src/storage/settings.js~SettingStorage.html) as `bot.storage.settings`

You probably will never need to use the first two, as they are used primarily by built-in commands/functionality.
The `SettingStorage`, however, could prove to be very useful for your bot.
It's essentially a key-value store that is associated with guilds, so you can store simple per-guild settings with it.

It is not recommended to use the storages to store large amounts of data or user-generated content.
Use [SQLite](https://www.npmjs.com/package/sqlite) or some other database for that.
