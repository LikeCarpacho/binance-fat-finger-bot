require('dotenv').config()
const https = require('https')
const crypto = require('crypto')
const { Telegraf } = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)

const apiKey = process.env.API_KEY
const apiSecret = process.env.API_SECRET

const generateSignature = (secretKey, data) => {
  const hmac = crypto.createHmac('sha256', secretKey)
  return hmac.update(data).digest('hex')
}

const placeMarketOrder = (symbol, side, quantity, type) => {
  const timestamp = Date.now()
  const endpoint = '/fapi/v1/order'
  const data = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&timestamp=${timestamp}`
  const signature = generateSignature(apiSecret, data)
  const options = {
    method: 'POST',
    hostname: 'fapi.binance.com',
    path: endpoint,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-MBX-APIKEY': apiKey,
    },
  }
  const req = https.request(options, (res) => {
    let body = ''
    res.on('data', (chunk) => {
      body += chunk
    })
    res.on('end', () => {
      console.log(JSON.parse(body))
    })
  })
  req.write(`${data}&signature=${signature}`)
  req.end()

  if (type === 'open') {
    setTimeout(() => {
      placeMarketOrder(symbol, side === 'BUY' ? 'SELL' : 'BUY', quantity, 'close')
      bot.telegram.sendMessage(process.env.USER_ID, `<code>${symbol}</code>  CLOSED ❌`, { parse_mode: 'HTML' })
    }, process.env.STOP_TIMEOUT * 1000)
  }
}

module.exports = { placeMarketOrder }
