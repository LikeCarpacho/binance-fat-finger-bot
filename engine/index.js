const stream = require('../binance/stream')
const orders = require('../binance/orders')
require('dotenv').config()
const { Telegraf } = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)

let priceChanges = {}
let lastChanges = {}
let lastAlertTime = {}
let mainInterval

const roundNumber = (num) => {
  if (num >= 1) {
    return Math.round(num)
  } else if (num >= 0.1) {
    return Math.round(num * 10) / 10
  } else if (num >= 0.01) {
    return Math.round(num * 100) / 100
  } else if (num >= 0.001) {
    return Math.round(num * 1000) / 1000
  } else if (num >= 0.0001) {
    return Math.round(num * 10000) / 10000
  } else {
    return Math.round(num * 100000) / 100000
  }
}

const start = () => {
  mainInterval = setInterval(() => {
    Object.keys(stream.currentPrices).forEach((symbol) => {
      const currentPrice = stream.currentPrices[symbol]
      const previousPrice = priceChanges[symbol] || currentPrice
      const positionAmount = process.env.DOLLAR_AMOUNT / currentPrice
      const positionAmountRounded = roundNumber(positionAmount)

      const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100

      priceChanges[symbol] = currentPrice

      if (!lastChanges[symbol]) {
        lastChanges[symbol] = []
      }
      lastChanges[symbol].push(percentChange)
      if (lastChanges[symbol].length > process.env.PARTS) {
        lastChanges[symbol].shift()
      }

      const sumOfLastChanges = lastChanges[symbol].reduce((a, b) => a + b, 0)
      const lastChange = lastChanges[symbol][process.env.PARTS - 2]

      const currentTime = Date.now()
      if (!lastAlertTime[symbol] || currentTime - lastAlertTime[symbol] >= process.env.DELAY_BETWEEN_ORDERS * 1000) {
        if (lastChange <= 0 && percentChange >= 0 && sumOfLastChanges < -process.env.IMPULSE_SIZE) {
          bot.telegram.sendMessage(process.env.USER_ID, `<code>${symbol}</code>  OPEN ⬆️`, { parse_mode: 'HTML' })
          orders.placeMarketOrder(symbol, 'BUY', positionAmountRounded, 'open')
          lastAlertTime[symbol] = currentTime
        }

        if (lastChange >= 0 && percentChange <= 0 && sumOfLastChanges > process.env.IMPULSE_SIZE) {
          bot.telegram.sendMessage(process.env.USER_ID, `<code>${symbol}</code> OPEN ⬇️`, { parse_mode: 'HTML' })
          orders.placeMarketOrder(symbol, 'SELL', positionAmountRounded, 'open')
          lastAlertTime[symbol] = currentTime
        }
      }
    })
  }, process.env.INTERVAL)
}

const stop = () => {
  clearInterval(mainInterval)
  priceChanges = {}
  lastChanges = {}
  lastAlertTime = {}
}

module.exports = { start, stop }
