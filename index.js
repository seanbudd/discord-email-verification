const CONFIG = process.env.DISCORD_LOGIN_API_TOKEN == undefined ? require('./config.json') : process.env

const cryptoJSON = require('crypto-json')

const ENCRYPTED_MEMBERS = require('./members.json')

const MEMBERS =
  CONFIG.CRYPTO_JSON_MEMBER_ENCRYPT_KEY != undefined
    ? cryptoJSON.decrypt(ENCRYPTED_MEMBERS, CONFIG.CRYPTO_JSON_MEMBER_ENCRYPT_KEY, {
      encoding: CONFIG.CRYPTO_JSON_ENCODING,
      keys: ['members'],
      algorithm: CONFIG.CRYPTO_JSON_ALGORITHM
    }).members
    : ENCRYPTED_MEMBERS.members

const { Email } = require('./smtp.js')

const Discord = require('discord.js')
const client = new Discord.Client()

const Keyv = require('keyv')
const discord_email = new Keyv(CONFIG.DATABASE_URL, { namespace: 'discord_email' })
const code_email_temp = new Keyv(CONFIG.DATABASE_URL, { namespace: 'code_email_temp' })
const code_discord_temp = new Keyv(CONFIG.DATABASE_URL, { namespace: 'code_discord_temp' })
const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

code_discord_temp.clear()
code_email_temp.clear()

client.once('ready', () => console.log('Starting!'))

client.login(CONFIG.DISCORD_LOGIN_API_TOKEN).then(console.log('Logged In!'))

client.on('message', message => {
  if (message.author.bot) {
    return
  }
  const MESSAGE_PREFIX = 'Hey ' + message.author.username + '! '
  let text = message.content.trim()
  if (message.channel.id === CONFIG.WELCOME_CHANNEL_ID) {
    const is_self_join_alias = text in CONFIG.SELF_JOIN_ALIASES
    if (message.content === '!verify') {
      message.author
        .createDM()
        .then(dmchannel =>
          dmchannel.send('Reply with your email for verification').catch(reason => console.log(reason))
        )
        .catch(reason => console.log(reason))
    } else if (message.type === 'GUILD_MEMBER_JOIN') {
      message.channel
        .send(MESSAGE_PREFIX + "Send '!verify' to access other channels")
        .catch(reason => console.log(reason))
    }
    else if (text.startsWith(CONFIG.SELF_JOIN_COMMAND) || is_self_join_alias) {
      let guild = client.guilds.get(CONFIG.GUILD_ID)
      let msg = is_self_join_alias ? CONFIG.SELF_JOIN_ALIASES[text] : text
      let msg_roles = msg.replace('!join', '').trim()

      guild
        .fetchMember(message.author)
        .then(member => {
          if (msg_roles === '') {
            message.channel.send(`Please specify the role you would like to join`).catch(reason => console.log(reason))
          } else {
            let verified_role = role = guild.roles.find(role => role.name === CONFIG.VERIFIED_ROLE_NAME)
            if (!CONFIG.SELF_JOIN_REQUIRE_VERIFIED || member.roles.has(verified_role.id)) {
              for (let msg_role of msg_roles.split(',').map(role_name => role_name.trim())) {
                const guild_role = guild.roles.find(role => role.name === msg_role)
                if (guild_role) {
                  if (CONFIG.SELF_JOIN_ROLE_NAMES.includes(msg_role)) {
                    if (member.roles.has(guild_role.id)) {
                      member
                        .removeRole(guild_role)
                        .then(message.channel.send(`Left role '${msg_role}'`).catch(reason => console.log(reason)))
                    } else {
                      member
                        .addRole(guild_role)
                        .then(message.channel.send(`Joined role '${msg_role}'`).catch(reason => console.log(reason)))
                    }
                  } else {
                    message.channel.send(`You are not allowed to join '${msg_role}'`).catch(reason => console.log(reason))
                  }
                } else {
                  message.channel.send(`Cannot find role '${msg_role}'`).catch(reason => console.log(reason))
                }
              }
            } else {
              message.channel.send(`You need to be verified to join roles`).catch(reason => console.log(reason))
            }
          }
        })
        .catch(reason => console.log(reason))
    }
  } else if (message.channel.guild == null) {
    if (new RegExp(CONFIG.EMAIL_REGEX).test(text)) {
      let email_address = text
      if (isMember(email_address)) {
        let code = makeid(6)
        code_email_temp.set(code, email_address, 10 * 60 * 1000)
        code_discord_temp.set(code, message.author.id, 10 * 60 * 1000)
        sendEmail(email_address, code)
          .then(
            message.channel
              .send(MESSAGE_PREFIX + 'Check your email now! Reply with the code we sent you')
              .catch(reason => console.log(reason))
          )
          .catch(reason => console.log(reason))
      } else {
        message.channel.send(MESSAGE_PREFIX + CONFIG.MEMBER_JOIN_MESSAGE).catch(reason => console.log(reason))
      }
    } else if (text.match(/^[a-zA-Z0-9]{6}$/)) {
      Promise.all([code_email_temp.get(text), code_discord_temp.get(text)])
        .then(([email_address, discord_id]) => {
          if (email_address && discord_id && discord_id === message.author.id) {
            discord_email.set(message.author.id, email_address)
            let guild = client.guilds.get(CONFIG.GUILD_ID)
            let role = guild.roles.find(role => role.name === CONFIG.VERIFIED_ROLE_NAME)
            guild
              .fetchMember(message.author)
              .then(member =>
                member
                  .addRole(role)
                  .then(message.channel.send('You are now verified!').catch(reason => console.log(reason)))
              )
              .catch(reason => console.log(reason))
          } else {
            message.channel.send(MESSAGE_PREFIX + "That code isn't right")
          }
        })
        .catch(reason => console.log(reason))
    }
  }
})

// assuming we have a *.json list of members
isMember = email_address => MEMBERS.indexOf(email_address) > -1

// https://www.smtpjs.com/
sendEmail = (email_address, code) =>
  Email.send({
    SecureToken: CONFIG.SMPT_JS_LOGIN_TOKEN,
    To: email_address,
    From: CONFIG.FROM_EMAIL,
    Subject: CONFIG.EMAIL_SUBJECT,
    Body: 'Your code is: ' + code
  })

makeid = length => [...Array(length)].map(() => ALPHANUM.charAt(Math.floor(Math.random() * ALPHANUM.length))).join('')
