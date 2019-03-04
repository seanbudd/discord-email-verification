# Info

Built on [SMPT.js](https://www.smtpjs.com/), [KeyV](https://github.com/lukechilds/keyv) and [discord.js](https://discord.js.org/#/)

# Setup

Requires node/npm

Run `npm install .`

# Config

Make a copy of config.json.template named config.json. You can alternatively use process.env for the same data.


```js
{
    "DISCORD_LOGIN_API_TOKEN": "", // https://discordjs.guide/preparations/setting-up-a-bot-application.html#your-token
    "DATABASE_URL": "", // any database string that keyv https://discordjs.guide/keyv/#installation
    "FROM_EMAIL": "", // Email you want as a reply to
    "EMAIL_SUBJECT": "Discord Verification", // Email subject you want
    "ROLE_NAME": "", // name of the role people get once verified
    "GUILD_ID": "", // your channel/guild ID
    "WELCOME_CHANNEL_ID": "", // the welcome channel you want the bot to operate on
    "MEMBER_JOIN_MESSAGE": "", // the message you want people to receive if they aren't in your members.json
    "EMAIL_REGEX": ".*@.*", // regex you want to verify emails before sending, could be domain specific
    "SMPT_JS_LOGIN_TOKEN": "", // https://www.smtpjs.com/
    "CRYPTO_JSON" : { //https://www.npmjs.com/package/crypto-json to encrypt member data, optional
        "ALGORITHM": "",
        "ENCODING": "",
        "MEMBER_ENCRYPT_KEY": ""
    }
}

```

Make a copy of members.json.template named members.json. The value for the members key should contain an array of email addresses of those allowed to join your Discord server

# Hosting

start the bot server by running

`>>> node index.js`

or

`>>> npm start`
