const { microGraphql } = require('apollo-server-micro')
const { mergeSchemas } = require('graphql-tools')
const { graphql: event } = require('./app/event')
const { schema: location } = require('./app/location')

const stitch = `
extend type Event {
  location: Location!
}
extend type Location {
  events(first: Int, last: Int, before: String, after: String): EventConnection!
}
`

const schema = mergeSchemas({
  schemas: [ event.schema, location, stitch ],
  resolvers: (mergeInfo) => ({
    Location: {
      events: {
        fragment: 'fragment LocationFragment on Location { id }',
        resolve ({ id }, { first, last, before, after }, context, info) {
          return mergeInfo.delegate(
            'query',
            'events',
            { locationId: id, first, last, before, after },
            context,
            info
          )
        }
      }
    },
    Event: {
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
      }
    }
  })
})

module.exports = microGraphql((req) => ({
  schema,
  context: { viewer: { roles: ['admin'] } }
}))
