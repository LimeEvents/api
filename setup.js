require('dotenv').load()

const performer = require('./src/services/performer/setup')
const event = require('./src/services/event/setup')
const order = require('./src/services/order/setup')

async function setupAll () {
  await performer()
  await event()
  await order()
}

setupAll()
  .then(() => {
    process.exit(0)
  })
  .catch((ex) => {
    console.log(ex)
    process.exit(1)
  })
