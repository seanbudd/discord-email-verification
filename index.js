const CONFIG = require('./config.json')
const MEMBERS = require('./members.json')

const { Email } = require('./smtp.js')

const Discord = require('discord.js')
const client = new Discord.Client()

const Keyv = require('keyv')
const discord_email = new Keyv(CONFIG.DATABASE_STRING, { namespace: 'discord_email' })
const code_email_temp = new Keyv(CONFIG.DATABASE_STRING, { namespace: 'code_email_temp' })
const code_discord_temp = new Keyv(CONFIG.DATABASE_STRING, { namespace: 'code_discord_temp' })
const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

discord_email.clear()
code_discord_temp.clear()
code_email_temp.clear()

client.once('ready', () => {
  console.log('Starting!')
})

client.login(CONFIG.DISCORD_LOGIN_API_TOKEN).then()

client.on('message', message => {
  let text = message.content.trim()
  if (message.channel.id === CONFIG.WELCOME_CHANNEL_ID) {
    if (message.content === '!verify') {
      message.author.createDM().then(dmchannel => dmchannel.send('Reply with your student email for verification'))
    } else {
      message.channel.send('Hey ' + message.author.username + " you aren't a verified user. Send '!verify' to begin")
    }
  } else if (message.channel instanceof DMChannel) {
    if (new RegExp(CONFIG.EMAIL_REGEX).test(text)) {
      let email_address = text
      if (isMember(email_address)) {
        let code = makeid(6)
        code_email_temp.set(code, email_address, 10 * 60 * 1000)
        code_discord_temp.set(code, message.author.id, 10 * 60 * 1000)
        sendEmail(email_address, code).then(message.channel.send('Check your email now!'))
      } else {
        message.channel.send('Hey ' + message.author.username + " you aren't a verified user. Sign up so you can join")
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
            message.channel.send('Hey ' + message.author.username + " that code isn't right")
          }
        }
      )
    }
  }
})

// assuming we have a *.json list of members
isMember = email_address => email_address in MEMBERS

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
