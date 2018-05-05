exports.definition = `
  extend type Order {
    event: Event!
  }
`
exports.resolvers = ({ event }) => ({
  Order: {
    event: {
      fragment: 'fragment OrderEventFragment on Order { eventId }',
      resolve ({ eventId }, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: event,
          operation: 'query',
          fieldName: 'event',
          args: { id: eventId },
          context,
          info
        })
      }
    }
  }
})
