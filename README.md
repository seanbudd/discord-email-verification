# Info

Built on KeyV and discord.js

# Setup

Requires node/npm

Run `npm install .`

# Config

Make a copy of config.json.template named config.json


```json
{
    "DISCORD_LOGIN_API_TOKEN": "", // https://discordjs.guide/preparations/setting-up-a-bot-application.html#your-token
    "DATABASE_STRING": "", // any database string that keyv https://discordjs.guide/keyv/#installation
    "FROM_EMAIL": "", // Email you want as a reply to
    "EMAIL_SUBJECT": "Discord Verification", // Email subject you want
    "ROLE_NAME": "", // name of the role people get once verified
    "GUILD_ID": "", // your channel/guild ID
    "WELCOME_CHANNEL_ID": "", // the welcome channel you want the bot to operate on
    "MEMBER_JOIN_MESSAGE": "", // the message you want people to receive if they aren't in your members.json
    "EMAIL_REGEX": ".*@.*", // regex you want to verify emails before sending, could be domain specific
    "SMPT_JS_LOGIN_TOKEN": "" // https://www.smtpjs.com/
}
```

Also requires a `members.json` which has keys that are each of your members valid email addresses
