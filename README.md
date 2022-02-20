# Info

Built on [SMPT.js](https://www.smtpjs.com/), [KeyV](https://github.com/lukechilds/keyv) and [discord.js](https://discord.js.org/#/)

# Setup

Requires node 16.11.0+, npm 8.0.0 and sqlite.

Run `npm install .`

# Config

Make a copy of config.json.template named config.json. You can alternatively use process.env for the same data.


```js
{
    "DATABASE_URL": "sqlite://example.db", // sqlite db
    "DISCORD_LOGIN_API_TOKEN": "", // https://discordjs.guide/preparations/setting-up-a-bot-application.html#your-token
    "ROLE_NAME": "Member",
    "CLIENT_ID": "", // copy from the bot account (eg DMs window icon)
    "GUILD_ID": "", // copy from server
    "WELCOME_CHANNEL_ID": "", // copy from channel
    "MEMBER_JOIN_MESSAGE": "Email address cannot be found, join via , otherwise ask for help in #welcome",
    "EMAIL_SUBJECT": "Discord Verification",
    "FROM_EMAIL": "",
    "EMAIL_REGEX": ".*@.*",
    "EMAIL_HOST": "", // SMTP host
    "EMAIL_PWD": ""
}
```

Make a copy of members.json.template named members.json. The value for the members key should contain an array of email addresses of those allowed to join your Discord server

# Hosting

start the bot server by running

`>>> node index.js`

or

`>>> npm start`
