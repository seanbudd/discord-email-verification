const CONFIG = process.env.DISCORD_LOGIN_API_TOKEN == undefined ? require('./config.json') : process.env
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');


const MEMBERS = ENCRYPTED_MEMBERS = require('./members.json')

const { Email } = require('./smtp.js')

const Discord = require('discord.js')
const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.DIRECT_MESSAGES,
    Discord.Intents.FLAGS.GUILDS,
  ]
})

const Keyv = require('keyv')
const discord_email = new Keyv(CONFIG.DATABASE_URL, { namespace: 'discord_email' })
const code_email_temp = new Keyv(CONFIG.DATABASE_URL, { namespace: 'code_email_temp' })
const code_discord_temp = new Keyv(CONFIG.DATABASE_URL, { namespace: 'code_discord_temp' })
const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

code_discord_temp.clear()
code_email_temp.clear()

client.once('ready', () => console.log('Starting!'))

const rest = new REST({ version: '9' }).setToken(CONFIG.DISCORD_LOGIN_API_TOKEN);
rest.put(
  Routes.applicationGuildCommands(CONFIG.CLIENT_ID, CONFIG.GUILD_ID),
  {
    body: [
      new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify and access the discord using your email address')
        .addStringOption(option =>
          option.setName('email')
            .setDescription('The email address you signed up with')
            .setRequired(true)
        ).toJSON(),
      new SlashCommandBuilder()
        .setName('emailtoken')
        .setDescription('Confirm your email address with the token generated using /verify')
        .addStringOption(option =>
          option.setName('token')
            .setDescription('The token sent to your email address from using /verify')
            .setRequired(true)
        ).toJSON(),
    ]
  },
)

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'verify') {
    const MESSAGE_PREFIX = 'Hey ' + interaction.member.nickname + '!\n'
    let email_address = interaction.options.getString("email")
    if (new RegExp(CONFIG.EMAIL_REGEX).test(email_address) && isMember(email_address)) {
      let code = makeid(6)
      code_email_temp.set(code, email_address, 10 * 60 * 1000)
      code_discord_temp.set(code, interaction.member.id, 10 * 60 * 1000)
      sendEmail(email_address, code)
        .then(
          interaction.reply({
            content: MESSAGE_PREFIX + 'Check your email now to confirm your email with the code we sent you.',
            ephemeral: true
          }).then(
            interaction.followUp(
              {
                content: "Confirm the token by sending /emailtoken, example: `/emailtoken 123456`",
                ephemeral: true
              }
            )
          )
        )
        .catch(reason => console.log(reason))
    } else {
      interaction.reply({
        content: MESSAGE_PREFIX + CONFIG.MEMBER_JOIN_MESSAGE,
        ephemeral: true
      })

    }
  }
  else if (interaction.commandName === 'emailtoken') {
    let token = interaction.options.getString("token")
    if (token.match(/^[a-zA-Z0-9]{6}$/)) {
      Promise.all([code_email_temp.get(token), code_discord_temp.get(token)])
        .then(([email_address, discord_id]) => {
          if (email_address && discord_id && discord_id === interaction.member.id) {
            discord_email.set(interaction.member.id, email_address)
            let role = interaction.guild.roles.cache.find(role => role.name === CONFIG.ROLE_NAME)
            interaction.member.roles.add(role)
            interaction.reply({
              content: 'You are now verified!',
              ephemeral: true
            })
          } else {
            interaction.reply({
              content: "That code isn't right",
              ephemeral: true
            })
          }
        })
        .catch(reason => console.log(reason))
    }
  }
})


client.login(CONFIG.DISCORD_LOGIN_API_TOKEN).then(console.log('Logged In!'))
client.on('messageCreate', message => {
  if (message.author.bot) {
    return
  }
  const MESSAGE_PREFIX = 'Hey ' + message.author.username + '! '
  if (message.channel.id === CONFIG.WELCOME_CHANNEL_ID) {
    if (message.type === 'GUILD_MEMBER_JOIN') {
      message.channel
        .send(MESSAGE_PREFIX + "Send '!verify' to access other channels")
        .catch(reason => console.log(reason))
    }
  }
})

isMember = email_address => MEMBERS.members.indexOf(email_address.toLowerCase()) > -1

// https://www.smtpjs.com/
sendEmail = (email_address, code) =>
  Email.send({
    Host: CONFIG.EMAIL_HOST,
    Username: CONFIG.FROM_EMAIL,
    Password: CONFIG.EMAIL_PWD,
    To: email_address,
    From: CONFIG.FROM_EMAIL,
    Subject: CONFIG.EMAIL_SUBJECT,
    Body: 'Your code is: ' + code
  })

makeid = length => [...Array(length)].map(() => ALPHANUM.charAt(Math.floor(Math.random() * ALPHANUM.length))).join('')
