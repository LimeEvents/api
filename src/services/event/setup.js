const faker = require('faker')
const uuid = require('uuid/v4')

const { application: eventApplication } = require('./interface')
const { application: performerApplication } = require('../performer')
const { application: locationApplication } = require('../location')

const VIEWER = { roles: ['admin'], name: 'system' }
const AGE_RANGES = ['7-', '13-', '18-', '21-']
let performers = null
let locations = null

async function createFakeEvents () {
  if (process.env.NODE_ENV === 'production') throw new Error('Cannot run fake data script on production')

  await Promise.all(
    new Array(Math.ceil(Math.random() * 1000)).fill(null).map(async () => {
      const start = Date.now() + (Math.ceil(Math.random() * 365) * 1000 * 60 * 60 * 24)
      const myEvent = {
        clientMutationId: uuid(), // ID!
        image: faker.image.people(), // Url
        locationId: await getRandomLocationId(), // ID!
        performerIds: [ await getRandomPerformerId() ], // [ ID! ]
        start,
        end: start + (1000 * 60 * 90), // DateTime
        price: Math.round(Math.random() * 3000 + 500), // Float!
        capacity: Math.random() > 0.5 ? Math.round(Math.random() * 300) : undefined, // Int!
        ageRange: pickRandom(AGE_RANGES)[0], // String
        minimumAge: Math.random() > 0.5 ? '21-' : '7-', // Int
        notes: [] // [ String! ]
      }

      const event = await eventApplication.create(VIEWER, myEvent)
      return event
    })
  )
  const results = await eventApplication.find(VIEWER)
  return results
}

createFakeEvents()
  .then((results) => {
    console.info(`Created ${results.length} events`)
    process.exit(0)
  })
  .catch((ex) => {
    console.error('Problem creating events', ex)
    process.exit(1)
  })

async function getRandomLocationId () {
  if (!locations) {
    locations = locationApplication.find()
  }

  return pickRandom(await locations)[0].id
}

async function getRandomPerformerId () {
  if (!performers) {
    performers = performerApplication.find()
  }
  return pickRandom(await performers)[0].id
}

function pickRandom (arr, count = 1) {
  const results = []
  arr = results.concat(arr)
  while (count--) {
    results.push(...arr.splice(Math.floor(Math.random() * arr.length), 1))
  }
  return results
}
