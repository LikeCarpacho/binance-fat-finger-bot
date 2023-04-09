require('dotenv').config()
const WebSocket = require('ws')
const { Telegraf } = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)

let currentPrices = {}
let ws = null

const start = () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('WebSocket is already running')
    bot.telegram.sendMessage(process.env.USER_ID, `WebSocket is already running`, { parse_mode: 'HTML' })
    return
  }

  ws = new WebSocket('wss://fstream.binance.com/ws')

  ws.on('open', () => {
    console.log('WebSocket connection opened')
    bot.telegram.sendMessage(process.env.USER_ID, `WebSocket connection opened`, { parse_mode: 'HTML' })
    ws.send(
      JSON.stringify({
        method: 'SUBSCRIBE',
        params: ['!bookTicker'],
        id: 1,
      })
    )

    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ method: 'PING' }))
      }
    }, 30000)
  })

  ws.on('message', (data) => {
    const message = JSON.parse(data)
    const symbol = message.s
    const bidPrice = parseFloat(message.b)

    if (symbol !== undefined && !isNaN(bidPrice)) {
      currentPrices[symbol] = bidPrice
    }
  })

  ws.on('close', (code, reason) => {
    console.log(`WebSocket connection closed with code ${code}: ${reason}`)
    console.log('Reconnecting...')
    bot.telegram.sendMessage(process.env.USER_ID, `WebSocket connection closed\nReconnecting...`, { parse_mode: 'HTML' })
    start()
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message)
    console.log('Reconnecting...')
    bot.telegram.sendMessage(process.env.USER_ID, `WebSocket connection closed\nReconnecting...`, { parse_mode: 'HTML' })
    start()
  })
}

module.exports = { start, currentPrices }
