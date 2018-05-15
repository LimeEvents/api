exports.definition = `
  extend type Event {
    location: Location!
    orders(first: Int, last: Int, before: String, after: String): OrderConnection!
  }
`

exports.resolvers = ({ order, location }) => ({
  Event: {
    orders: {
      fragment: 'fragment EventOrdersFragment on Event { id }',
      resolve ({ id }, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: order,
          operation: 'query',
          fieldName: 'orders',
          args: { filter: { eventId: id }, ...args },
          context,
          info
        })
      }
    },
    location: {
      fragment: 'fragment EventLocationFragment on Event { locationId }',
      resolve ({ locationId }, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: location,
          operation: 'query',
          fieldName: 'location',
          args: { id: locationId },
          context,
          info
        })
      }
    }
  }
})
