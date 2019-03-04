const CONFIG = process.env.DISCORD_LOGIN_API_TOKEN == undefined ? require('./config.json') : process.env

const cryptoJSON = require('crypto-json')

const ENCRYPTED_MEMBERS = require('./members.json')

const MEMBERS =
  CONFIG.CRYPTO_JSON != undefined
    ? cryptoJSON.decrypt(ENCRYPTED_MEMBERS, CONFIG.CRYPTO_JSON.MEMBER_ENCRYPT_KEY, {
      encoding: CONFIG.CRYPTO_JSON.ENCODING,
      keys: ['members'],
      algorithm: CONFIG.CRYPTO_JSON.ALGORITHM
    }).members
    : ENCRYPTED_MEMBERS

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

client.once('ready', () => {
  console.log('Starting!')
})

client.login(CONFIG.DISCORD_LOGIN_API_TOKEN).then()

client.on('message', message => {
  if (message.author.bot) {
    return
  }
  const MESSAGE_PREFIX = 'Hey ' + message.author.username + '! '
  let text = message.content.trim()
  if (message.channel.id === CONFIG.WELCOME_CHANNEL_ID) {
    if (message.content === '!verify') {
      message.author.createDM().then(dmchannel => dmchannel.send('Reply with your email for verification'))
    } else if (message.type === 'GUILD_MEMBER_JOIN') {
      message.channel.send(MESSAGE_PREFIX + "Send '!verify' to access other channels")
    }
  } else if (message.channel.guild == null) {
    if (new RegExp(CONFIG.EMAIL_REGEX).test(text)) {
      let email_address = text
      if (isMember(email_address)) {
        let code = makeid(6)
        code_email_temp.set(code, email_address, 10 * 60 * 1000)
        code_discord_temp.set(code, message.author.id, 10 * 60 * 1000)
        sendEmail(email_address, code).then(
          message.channel.send(MESSAGE_PREFIX + 'Check your email now! Reply with the code we sent you')
        )
      } else {
        message.channel.send(MESSAGE_PREFIX + CONFIG.MEMBER_JOIN_MESSAGE)
      }
    } else if (text.match(/^[a-zA-Z0-9]{6}$/)) {
      Promise.all([code_email_temp.get(text).then(), code_discord_temp.get(text)]).then(
        ([email_address, discord_id]) => {
          if (email_address && discord_id && discord_id === message.author.id) {
            discord_email.set(message.author.id, email_address)
            let guild = client.guilds.get(CONFIG.GUILD_ID)
            let role = guild.roles.find(role => role.name === CONFIG.ROLE_NAME)
            guild
              .fetchMember(message.author)
              .then(member => member.addRole(role).then(message.channel.send('You are now verified!')))
          } else {
            message.channel.send(MESSAGE_PREFIX + "That code isn't right")
          }
        }
      )
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
