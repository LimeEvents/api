const { connectionFromPromisedArray } = require('graphql-relay')
const { repository } = require('../repository')
const application = require('../../application')(repository)

module.exports = {
  Query: {
    event: refetchEvent,
    events (source, args, context, info) {
      return connectionFromPromisedArray(
        application.find(context.viewer, args.query),
        args
      )
    },
    stream (source, args, { viewer }, info) {
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
      const results = await application.cancel(viewer, input)
      results.clientMutationId = input.clientMutationId
      return results
    },
    async rescheduleEvent (source, { input }, { viewer }, info) {
      const results = await application.reschedule(viewer, input)
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

function refetchEvent (source, args, { viewer }, info) {
  return application.get(viewer, args.id || source.id)
}
