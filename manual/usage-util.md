## Utilities
Every bot has an instance of [`BotUtil`](../class/src/bot/util.js~BotUtil.html) as `bot.util`.
This contains several handy methods:
- [`usage`](../class/src/bot/util.js~BotUtil.html#instance-method-usage) creates command usage strings to send in messages
- [`nbsp`](../class/src/bot/util.js~BotUtil.html#instance-method-nbsp) converts all spaces in a string into non-breaking spaces
- [`disambiguation`](../class/src/bot/util.js~BotUtil.html#instance-method-disambiguation) creates disambiguation strings to send in messages
  (for when you find multiple matches from user input, and need a specific one)
- [`paginate`](../class/src/bot/util.js~BotUtil.html#instance-method-paginate) paginates an array of items, and returns info about the pagination
- [`search`](../class/src/bot/util.js~BotUtil.html#instance-method-search) searches an array of items and finds matches
- [`split`](../class/src/bot/util.js~BotUtil.html#instance-method-split) splits a string into multiple strings that will fit within Discord's 2,000 character limit
