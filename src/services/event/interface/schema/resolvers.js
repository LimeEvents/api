const { fromGlobalId, toGlobalId, connectionFromArray } = require('graphql-relay')

exports.resolvers = {
  Node: {
    __resolveType ({ id }) {
      return fromGlobalId(id).type
    }
  },
  Query: {
    node: refetchEvent(),
    event: refetchEvent(),
    async events (source, args, { viewer, application }, info) {
      if (args.first) args.first = Math.min(args.first, 50)
      if (args.last) args.last = Math.min(args.last, 50)
      const events = await application.find(viewer, args)
      const { pageInfo, edges } = connectionFromArray(events, args)
      return {
        pageInfo,
        edges: edges.map(
          ({ node, cursor }) => ({
            cursor,
            node: { ...node, id: toGlobalId('Event', node.id) }
          })
        )
      }
    }
  },
  Mutation: {
    async createEvent (source, { input }, { viewer, application }, info) {
      const { id } = await application.create(viewer, input)
      return { clientMutationId: input.clientMutationId, id: toGlobalId('Event', id) }
    },
    async cancelEvent (source, { input }, { viewer, application }, info) {
      const { id } = await application.cancel(viewer, { ...input, id: fromGlobalId(input.id).id })
      return { clientMutationId: input.clientMutationId, id: toGlobalId('Event', id) }
    },
    async rescheduleEvent (source, { input }, { viewer, application }, info) {
      const { id } = await application.reschedule(viewer, { ...input, id: fromGlobalId(input.id).id })
      return { clientMutationId: input.clientMutationId, id: toGlobalId('Event', id) }
    }
  },
  CreateEventResponse: {
    event: refetchEvent()
  },
  CancelEventResponse: {
    event: refetchEvent()
  },
  RescheduleEventResponse: {
    event: refetchEvent()
  }
}

function refetchEvent (field = 'id') {
  return async (source, args, { viewer, application }, info) => {
    const id = fromGlobalId(args[field] || source[field]).id
    const event = await application.get(viewer, id)
    return { ...event, id: toGlobalId('Event', id) }
  }
}
