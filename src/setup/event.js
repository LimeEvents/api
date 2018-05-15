const gql = require('graphql-tag')
const uuid = require('uuid/v4')
const memo = require('lodash.memoize')
const faker = require('faker')
const slug = require('slug')
const slugify = (str) => slug(str).toLowerCase()

const { graphql, print } = require('graphql')
const { loadSchema } = require('../index')

async function request (query, variables) {
  const { schema } = await loadSchema()
  return graphql(schema, print(query), {}, { viewer: { roles: ['administrator'] } }, variables)
}

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
  const results = await request(gql`
    query Locations { locations { edges { node { id } } } }
  `)
  return results.data.locations.edges.map(({ node }) => node)
})

exports.setupEvent = async function createFakeEvents () {
  if (process.env.NODE_ENV === 'production') throw new Error('Cannot run fake data script on production')
  const number = Math.ceil(Math.random() * 100)
  console.log('Creating', number, 'events')
  const results = await Promise.all(
    new Array(number).fill(null).map(async () => {
      const start = Date.now() + (Math.ceil(Math.random() * 365) * 1000 * 60 * 60 * 24)
      const name = `${faker.firstName()} ${faker.lastName()}`
      const input = {
        clientMutationId: uuid(), // ID!
        locationId: await getRandomLocationId(), // ID!
        name,
        slug: slugify(`${name}_${Math.round(start / 1000 / 60)}`),
        image: 'http://lorempixel.com/640/480/people',
        start,
        feeDistribution: Math.floor(Math.random() * 100),
        end: start + (1000 * 60 * 90), // DateTime
        price: Math.round(Math.random() * 3000 + 500), // Float!
        contentRating: pickRandom(CONTENT_RATINGS)[0], // String
        minimumAge: Math.random() > 0.5 ? 21 : 7, // Int
        notes: [] // [ String! ]
      }
      const event = await request(CREATE_EVENT_MUTATION, { input })
      return event
    })
  )
  return results
}

async function getRandomLocationId () {
  const locations = await listLocations()
  return pickRandom(locations)[0].id
}

function pickRandom (arr, count = 1) {
  const results = []
  arr = results.concat(arr)
  while (count--) {
    results.push(...arr.splice(Math.floor(Math.random() * arr.length), 1))
  }
  return results
}
