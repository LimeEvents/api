const { microGraphql } = require('apollo-server-micro')
const { mergeSchemas } = require('graphql-tools')
const { graphql: event } = require('./app/event')
const { schema: location } = require('./app/location')
const { schema: performer } = require('./app/performer')
const { schema: order } = require('./app/order')

const stitch = `
extend type Event {
  location: Location!
  performers(first: Int, last: Int, before: String, after: String): PerformerConnection!
}
extend type Location {
  events(first: Int, last: Int, before: String, after: String): EventConnection!
}
extend type Performer {
  events(first: Int, last: Int, before: String, after: String): EventConnection!
}
extend type Event {
  inventory: Inventory!
}
extend type Order {
  event: Event!
}
`

const schema = mergeSchemas({
  schemas: [ event.schema, location, performer, order, stitch ],
  resolvers: (mergeInfo) => ({
    Performer: {
      events: {
        fragment: 'fragment PerformerFragment on Performer { id }',
        async resolve ({ id }, { first, last, before, after }, context, info) {
          const events = await mergeInfo.delegate(
            'query',
            'events',
            { filter: { performerId: id }, first, last, before, after },
            context,
            info
          )
          return events
        }
      }
    },
    Location: {
      events: {
        fragment: 'fragment LocationFragment on Location { id }',
        async resolve ({ id }, { first, last, before, after }, context, info) {
          const events = await mergeInfo.delegate(
            'query',
            'events',
            { filter: { locationId: id }, first, last, before, after },
            context,
            info
          )
          return events
        }
      }
    },
    Order: {
      event: {
        fragment: 'fragment OrderFragment on Order { eventId }',
        resolve ({ eventId: id }, args, context, info) {
          return mergeInfo.delegate(
            'query',
            'event',
            { id },
            context,
            info
          )
        }
      }
    },
    Event: {
      inventory: {
        fragment: 'fragment EventFragment on Event { id, locationId }',
        resolve ({ id, locationId }, args, context, info) {
          return mergeInfo.delegate(
            'query',
            'inventory',
            { eventId: id },
            context,
            info
          )
        }
      },
      location: {
        fragment: 'fragment EventFragment on Event { locationId }',
        resolve ({ locationId: id }, args, context, info) {
          return mergeInfo.delegate(
            'query',
            'location',
            { id },
            context,
            info
          )
        }
      },
      performers: {
        fragment: 'fragment EventFragment on Event { performerIds }',
        resolve ({ performerIds }, { first, last, before, after }, context, info) {
          return mergeInfo.delegate(
            'query',
            'performers',
            { filter: { id: performerIds }, first, last, before, after },
            context,
            info
          )
        }
      }
    }
  })
})

exports.http = microGraphql((req) => ({
  schema,
  context: { viewer: { roles: ['admin'] } }
}))

exports.schema = schema
