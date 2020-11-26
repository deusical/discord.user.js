# discord.user.js

## CURRENTLY INDEV, AND I RANDOMLY PUSH, SO IT MIGHT BREAK SOMETIMES

A discord selfbot userscript library. Cause why not?

To setup, make a tampermonkey script and set
```js
// @run-at       document-body
// @require      https://raw.githubusercontent.com/deusical/discord.user.js/main/discord.js
```
This script creates a selfbot class which is all you need.
```js
const client = new selfbot();

client.on('message', console.log)

client.run()
```
You do not need to specify your discord token, as the userscript already stores it.
I will write some documentation on my website later.