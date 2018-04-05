const { connectionFromPromisedArray } = require('graphql-relay')
const application = require('./application')

module.exports = {
  Query: {
    performer: refetchPerformer,
    performers (source, args, { viewer }) {
      return connectionFromPromisedArray(
        application.find(viewer, args),
        args
      )
    }
  },
  Mutation: {
    async registerPerformer (source, { input }, { viewer }) {
      const results = await application.register(viewer, input)
      results.clientMutationId = input.clientMutationId
      return results
    },
    async updatePerformer (source, { input }, { viewer }) {
      const results = await application.update(viewer, input)
      results.clientMutationId = input.clientMutationId
      return results
    },
    async removePerformer (source, { id, clientMutationId }, { viewer }) {
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

function refetchPerformer (source, args, { viewer }) {
  return application.get(viewer, args.id || source.id)
}
