require('dotenv').load()
// const faker = require('faker')
const { Repository } = require('@vivintsolar/graphql-repository')
const gql = require('graphql-tag')
const uuid = require('uuid/v4')
const memo = require('lodash.memoize')
const slug = require('slug')
const slugify = (str) => slug(str).toLowerCase()

const { link: eventService } = require('./index')
const { link: locationService } = require('../location')
const { link: performerService } = require('../performer')

// const VIEWER = { roles: ['admin'], name: 'system' }
const CONTENT_RATINGS = ['G', 'PG', 'PG13', 'R']

const CREATE_EVENT_MUTATION = gql`
  mutation CreateEventMutation($input: CreateEventInput!) {
    createEvent(input: $input) {
      clientMutationId
      event {
        id
      }
    }
  }
`

const listLocations = memo(async function () {
  const service = new Repository({ get: 'location', find: 'locations', link: await locationService() })
  return service.find({}, '{ id }')
})

const listPerformers = memo(async function () {
  const service = new Repository({ get: 'performer', find: 'performers', link: await performerService() })
  return service.find({}, '{ id name images }')
})

exports.setupEvent = async function createFakeEvents () {
  if (process.env.NODE_ENV === 'production') throw new Error('Cannot run fake data script on production')
  const service = new Repository({ get: 'event', link: await eventService() })
  const number = Math.ceil(Math.random() * 1000)
  const results = await Promise.all(
    new Array(number).fill(null).map(async () => {
      const start = Date.now() + (Math.ceil(Math.random() * 365) * 1000 * 60 * 60 * 24)
      const performer = await getRandomPerformer()
      const input = {
        clientMutationId: uuid(), // ID!
        locationId: await getRandomLocationId(), // ID!
        performerIds: [ performer.id ], // [ ID! ]
        name: performer.name,
        slug: slugify(`${performer.name}_${Math.round(start / 1000 / 60)}`),
        image: performer.images[0] || 'http://lorempixel.com/640/480/people',
        start,
        end: start + (1000 * 60 * 90), // DateTime
        price: Math.round(Math.random() * 3000 + 500), // Float!
        capacity: Math.random() > 0.5 ? Math.round(Math.random() * 300) : undefined, // Int!
        contentRating: pickRandom(CONTENT_RATINGS)[0], // String
        minimumAge: Math.random() > 0.5 ? 21 : 7, // Int
        notes: [] // [ String! ]
      }
      console.log(input)
      const event = await service.request(CREATE_EVENT_MUTATION, { input })
      return event
    })
  )
  return results
}

exports.setupEvent()
  .catch(console.error.bind(console))

async function getRandomLocationId () {
  const locations = await listLocations()
  return pickRandom(locations)[0].id
}

async function getRandomPerformer () {
  const performers = await listPerformers()
  return pickRandom(performers)[0]
}

function pickRandom (arr, count = 1) {
  const results = []
  arr = results.concat(arr)
  while (count--) {
    results.push(...arr.splice(Math.floor(Math.random() * arr.length), 1))
  }
  return results
}
