const { connectionFromPromisedArray } = require('graphql-relay')

module.exports = {
  Query: {
    performer: refetchPerformer,
    performers (source, args, { viewer, application }) {
      if (args.first) args.first = Math.min(args.first, 50)
      if (args.last) args.last = Math.min(args.last, 50)
      return connectionFromPromisedArray(
        application.find(viewer, args),
        args
      )
    }
  },
  Mutation: {
    async registerPerformer (source, { input }, { viewer, application }) {
      const results = await application.register(viewer, input)
      results.clientMutationId = input.clientMutationId
      return results
    },
    async updatePerformer (source, { input }, { viewer, application }) {
      const results = await application.update(viewer, input)
      results.clientMutationId = input.clientMutationId
      return results
    },
    async removePerformer (source, { id, clientMutationId }, { viewer, application }) {
      const results = await application.remove(viewer, id)
      results.clientMutationId = clientMutationId
      return results
    }
  },
  RegisterPerformerResponse: {
    performer: refetchPerformer
  },
  UpdatePerformerResponse: {
    performer: refetchPerformer
  },
  RemovePerformerResponse: {
    performer: refetchPerformer
  }
}

function refetchPerformer (source, args, { viewer, application }) {
  return application.get(viewer, args.id || source.id)
}
