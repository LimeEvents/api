require('dotenv').load()
const { setupPerformer } = require('./performer')
const { setupEvent } = require('./event')
const { setupOrder } = require('./order')

async function setup () {
  await setupPerformer()
  await setupEvent()
  await setupOrder()
}

setup()
  .then(() => {
    process.exit(0)
  })
  .catch((ex) => {
    console.error(ex)
    process.exit(1)
  })
