const assert = require('assert')
const { fromGlobalId } = require('graphql-relay')
const { mergeSchemas, delegateToSchema } = require('graphql-tools')

const { schema: event } = require('./services/event')
const { schema: location } = require('./services/location')
const { schema: order } = require('./services/order')
const { schema: performer } = require('./services/performer')

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
extend type Event {
  orders(first: Int, last: Int, before: String, after: String): OrderConnection!
}
`

const schemas = [ event.schema, location, performer, order ]

function getNodeResolver (schemas) {
  const typeMap = schemas.reduce((all, schemata) => {
    const possible = schemata.getPossibleTypes(schemata.getType('Node'))

    if (!possible) return all
    possible
      .forEach((type) => {
        all[type.toString()] = schemata
      })
    return all
  }, {})

  return function node (source, args, context, info) {
    const id = args.id || source.id
    assert(id, 'Node resolver requires an ID')
    const { type } = fromGlobalId(id)
    const schemata = typeMap[type]
    if (!schemata) throw new Error('Invalid Node ID')
    return delegateToSchema(schemata, 'query', 'node', { id }, context, info)
  }
}

module.exports = mergeSchemas({
  schemas: [ ...schemas, stitch ],
  resolvers: (mergeInfo) => ({
    Query: {
      node: getNodeResolver(schemas)
    },
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
      orders: {
        fragment: 'fragment EventFragment on Event { id }',
        resolve ({ id: eventId }, args, context, info) {
          return mergeInfo.delegate(
            'query',
            'orders',
            { filter: { eventId }, ...args },
            context,
            info
          )
        }
      },
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
