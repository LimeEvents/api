const faker = require('faker')
const uuid = require('uuid/v4')

const { application: eventApplication } = require('../event/interface')
const { application: orderApplication } = require('./interface')

const VIEWER = { roles: ['admin'], name: 'system' }
let events = null

module.exports = async function createFakeOrders () {
  if (process.env.NODE_ENV === 'production') throw new Error('Cannot run fake data script on production')

  await Promise.all(
    new Array(Math.ceil(Math.random() * 10000)).fill(null).map(async () => {
      const event = await createFakeOrder()
      return event
    })
  )
  const results = await eventApplication.find(VIEWER)
  console.info(`Created ${results.length} events`)
  return results
}

async function createFakeOrder () {
  const { id } = await orderApplication.create(VIEWER, {
    clientMutationId: uuid(), // ID!
    eventId: await getRandomEventId(), // ID!
    tickets: Math.ceil(Math.random() * 8) + 1 // Int!
  })

  await orderApplication.charge(VIEWER, {
    clientMutationId: uuid(), // ID!
    id, // ID!
    name: `${faker.name.firstName()} ${faker.name.lastName()}`, // String!
    email: faker.internet.email(), // String!
    source: uuid() // String!
  })
}

async function getRandomEventId () {
  if (!events) {
    events = eventApplication.find()
  }

  return pickRandom(await events)[0].id
}

function pickRandom (arr, count = 1) {
  const results = []
  arr = results.concat(arr)
  while (count--) {
    results.push(...arr.splice(Math.floor(Math.random() * arr.length), 1))
  }
  return results
}
