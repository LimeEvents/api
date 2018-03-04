const { connectionFromPromisedArray } = require('graphql-relay')
const { repository } = require('./repository')
const application = require('../application')(repository)

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

function refetchPerformer ({ id }, { id: _id }, { viewer }) {
  return application.get(viewer, id || id)
}
