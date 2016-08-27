## Permissions
Every bot has an instance of [`BotPermissions`](../class/src/bot/permissions.js~BotPermissions.html) as `bot.permissions` that contains handy methods for checking the permissions of a user on a server.
There are three permissions:
- Owner ([`isOwner`](../class/src/bot/permissions.js~BotPermissions.html#instance-method-isOwner)):
  Only the owner of the bot has this permission, and they have it in every server.
- Administrator ([`isAdmin`](../class/src/bot/permissions.js~BotPermissions.html#instance-method-isAdmin)):
  A user has this permission if they are the bot owner, or if they have a role on the server with the "Administrate" permission.
- Moderator ([`isMod`](../class/src/bot/permissions.js~BotPermissions.html#instance-method-isMod)):
  A user has this permission if they are the bot owner, they are an admin, or they have one of the moderator roles assigned.
  If there are no moderator roles set in the server, then the "Manage messages" permission on any of their roles will make them a moderator instead.
