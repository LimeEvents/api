const { fromGlobalId, toGlobalId, connectionFromArray } = require('graphql-relay')

const { refetchChannel, refetchProduct } = require('./utils')

const resolvers = {
  Query: {
    channel: refetchChannel(),
    async channels (source, args, { application }) {
      const { first, last, before, after } = args
      const channels = await application.listChannels({ cursor: before || after, limit: first || last })
      return connectionFromArray(channels, args)
    }
  },
  Channel: {
    id: ({ id }) => toGlobalId('Channel', id),
    metadata: ({ metadata }) => metadata || {},
    async products ({ id }, args, { application }) {
      const { first, last, before, after } = args
      const products = await application.listChannelProducts({
        id,
        cursor: before || after,
        limit: first || last
      })
      return connectionFromArray(products, args)
    }
  },
  Mutation: {
    async addChannel (source, { input: { clientMutationId, ...input } }, { application }) {
      const { id } = await application.addChannel(input)
      return { clientMutationId, id }
    },
    async enableChannel (source, { input: { clientMutationId, id, start } }, { application }) {
      await application.enableChannel({ id: fromGlobalId(id).id, start })
      return { clientMutationId, id }
    },
    async disableChannel (source, { input: { clientMutationId, id, start } }, { application }) {
      await application.disableChannel({ id: fromGlobalId(id).id, start })
      return { clientMutationId, id }
    },
    async updateChannel (source, { input: { clientMutationId, id, ...updates } }, { application }) {
      await application.updateChannel({ ...updates, id: fromGlobalId(id).id })
      return { clientMutationId, id }
    },
    async removeChannel (source, { input: { clientMutationId, id } }, { application }) {
      await application.removeChannel({ id: fromGlobalId(id).id })
      return { clientMutationId, id }
    },
    async publishChannelProduct (source, { input: { clientMutationId, id, productId } }, { application }) {
      await application.publishChannelProduct({
        id: fromGlobalId(id).id,
        productId: fromGlobalId(productId).id })
      return { clientMutationId, id, productId }
    },
    async unpublishChannelProduct (source, { input: { clientMutationId, id, productId } }, { application }) {
      await application.unpublishChannelProduct({
        id: fromGlobalId(id).id,
        productId: fromGlobalId(productId).id })
      return { clientMutationId, id, productId }
    }
  },
  AddChannelResponse: {
    channel: refetchChannel()
  },
  UpdateChannelResponse: {
    channel: refetchChannel()
  },
  EnableChannelResponse: {
    channel: refetchChannel()
  },
  DisableChannelResponse: {
    channel: refetchChannel()
  },
  PublishChannelProductResponse: {
    channel: refetchChannel(),
    product: refetchProduct('productId')
  },
  UnpublishChannelProductResponse: {
    channel: refetchChannel(),
    product: refetchProduct('productId')
  }
}

exports.resolvers = resolvers
