const { fromGlobalId, toGlobalId, connectionFromPromisedArray } = require('graphql-relay')

exports.resolvers = {
  Node: {
    __resolveType ({ id }) {
      return fromGlobalId(id).type
    }
  },
  Query: {
    event: refetchEvent,
    async events (source, args, { viewer, application }, info) {
      if (args.first) args.first = Math.min(args.first, 50)
      if (args.last) args.last = Math.min(args.last, 50)
      const { pageInfo, edges } = await connectionFromPromisedArray(
        application.find(viewer, args),
        args
      )
      return {
        pageInfo,
        edges: edges.map(({ node }) => ({ node: { ...node, id: toGlobalId('Event', node.id) } }))
      }
    }
  },
  Mutation: {
    async createEvent (source, { input }, { viewer, application }, info) {
      const results = await application.create(viewer, input)
      results.clientMutationId = input.clientMutationId
      return results
    },
    async cancelEvent (source, { input }, { viewer, application }, info) {
      const results = await application.cancel(viewer, { ...input, id: fromGlobalId(input.id).id })
      results.clientMutationId = input.clientMutationId
      return results
    },
    async rescheduleEvent (source, { input }, { viewer, application }, info) {
      const results = await application.reschedule(viewer, { ...input, id: fromGlobalId(input.id).id })
      results.clientMutationId = input.clientMutationId
      return results
    }
  },
  CreateEventResponse: {
    event: refetchEvent
  },
  CancelEventResponse: {
    event: refetchEvent
  },
  RescheduleEventResponse: {
    event: refetchEvent
  }
}

async function refetchEvent (source, args, { viewer, application }, info) {
  const event = await application.get(viewer, args.id || source.id)
  return { ...event, id: toGlobalId('Event', event.id) }
}
