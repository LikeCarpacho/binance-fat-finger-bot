require('dotenv').config()
const stream = require('./binance/stream')
const engine = require('./engine')
const { Telegraf, Markup } = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.command('start', (ctx) => {
  if (ctx.message.chat.id == process.env.USER_ID) {
    stream.start()
    ctx.reply('HI THERE!\nPress "Run bot" to start.', Markup.keyboard([['Run bot', 'Stop bot']]).resize())
  }
})

bot.hears('Run bot', (ctx) => {
  stream.start()
  engine.start()
  ctx.reply('✅ Bot is now running!')
})

bot.hears('Stop bot', (ctx) => {
  engine.stop()
  ctx.reply('🛑 Bot has been stopped.')
})

bot.launch()
