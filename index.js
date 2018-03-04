const { microGraphql } = require('apollo-server-micro')
const { mergeSchemas } = require('graphql-tools')
const { graphql: event } = require('./app/event')
const { schema: location } = require('./app/location')
const performer = require('./app/performer')

const stitch = `
extend type Event {
  location: Location!
}
extend type Location {
  events(first: Int, last: Int, before: String, after: String): EventConnection!
}
`

const schema = mergeSchemas({
  schemas: [ event.schema, location, performer, stitch ],
  resolvers: (mergeInfo) => ({
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
