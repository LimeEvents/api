const { fromGlobalId, toGlobalId, connectionFromPromisedArray } = require('graphql-relay')
const application = require('../application')

module.exports = {
  Query: {
    event: refetchEvent,
    async events (source, args, context, info) {
      if (args.first) args.first = Math.min(args.first, 50)
      if (args.last) args.last = Math.min(args.last, 50)
      const { pageInfo, edges } = await connectionFromPromisedArray(
        application.find(context.viewer, args),
        args
      )
      return {
        pageInfo,
        edges: edges.map(({ node }) => ({ node: { ...node, id: toGlobalId('Event', node.id) } }))
      }
    },
    stream (source, args, { viewer }, info) {
      if (args.first) args.first = Math.min(args.first, 50)
      if (args.last) args.last = Math.min(args.last, 50)
      return connectionFromPromisedArray(
        application.list(viewer, args)
      )
    }
  },
  Mutation: {
    async createEvent (source, { input }, { viewer }, info) {
      const results = await application.create(viewer, input)
      results.clientMutationId = input.clientMutationId
      return results
    },
    async cancelEvent (source, { input }, { viewer }, info) {
      const results = await application.cancel(viewer, { ...input, id: fromGlobalId(input.id).id })
      results.clientMutationId = input.clientMutationId
      return results
    },
    async rescheduleEvent (source, { input }, { viewer }, info) {
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

async function refetchEvent (source, args, { viewer }, info) {
  const event = await application.get(viewer, args.id || source.id)
  return { ...event, id: toGlobalId('Event', event.id) }
}
