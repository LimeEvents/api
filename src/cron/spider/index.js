const get = require('lodash.get')
const memo = require('lodash.memoize')
const { graphql } = require('graphql')
const { getVenues, populateEvents } = require('./list')
const { getEvent, goodPlaceToStop } = require('./item')
const index = require('../../index')

const idMap = {}

const request = async (query, variables = {}) => {
  const { schema, services } = await index.loadSchema()
  return graphql(schema, query, {}, { viewer: { roles: ['administrator'] }, services }, variables)
}

const checkExisting = async (id) => {
  const results = await request(`
    query EventsByExternalId($filter: EventFilter!) {
      events(filter: $filter) {
        edges {
          node {
            id
            name
            externalIds
          }
        }
      }
    }
  `, { filter: { externalId: id } })

  const edges = get(results, 'data.events.edges', [])
  return edges.length > 0
}

async function create (event) {
  const results = await request(`
    mutation CreateEvent($createEvent: CreateEventInput!){
      createEvent(input: $createEvent) {
        clientMutationId
        event {
          ...EventFragment
        }
      }
    }

    fragment EventFragment on Event {
      id
      imageUrl: image
      summary: caption
      rating: contentRating
      title: name
      description
      locationId
      externalIds
      location {
        name
        id
        address {
          suite: address2
          city: locality
          state: region
          street: address1
          postalCode
        }
        slug
      }
      price
    }
  `, { createEvent: event })
  return results
}

exports.listEvents = async () => {
  const ids = await getVenues('WiseGuysComedy', 'WiseguysComedySLC', 'WiseguysComedyOgden', 'WiseguysJordanLanding')
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    const exists = await checkExisting(id)
    if (exists) continue
    const event = await getEvent(id)
    event.externalIds = [id]
    delete event.id
    event.acceptDiscounts = event.isSpecialEvent || false
    delete event.isSpecialEvent
    delete event.isSoldOut
    // delete event.url
    event.feeDistribution = 100
    event.clientMutationId = id
    if (event.contentRating === 'PG-13') event.contentRating = 'PG13'
    if (!event.contentRating) delete event.contentRating
    await create(event)
  }
  // return populateEvents(ids)
}

exports.idMap = idMap
exports.getEvent = getEvent
exports.goodPlaceToStop = goodPlaceToStop
