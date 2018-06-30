const { fromGlobalId, toGlobalId, connectionFromArray } = require('graphql-relay')
const assert = require('assert')
const memoize = require('lodash.memoize')
const Monk = require('monk')
const uuid = require('uuid/v4')

const connection = memoize(url => new Monk(url))
const collection = memoize(name => connection(process.env.MONGODB_URL).get(name))

const CHANNEL_SOURCE = 'channel.source'
const CHANNEL_VIEW = 'channel.view'
const PRODUCT_VIEW = 'product.view'
const CHANNEL_PRODUCT_LINK = 'channel.product.link'

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
    async products ({ productIds = [] }, args, { viewer }) {
      const { edges, pageInfo } = connectionFromArray(productIds.map(id => ({ id })), args)
      return {
        pageInfo,
        edges: await Promise.all(
          edges.map(async ({ node, cursor }) => {
            return {
              cursor,
              node: await getProduct(node.id)
            }
          })
        )
      }
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

function getChannel (id) {
  return collection(CHANNEL_VIEW).findOne({ id })
}
function refetchChannel (field = 'id') {
  return async (source, args, { application }) => {
    const id = args[field] || source[field]
    const channel = await application.getChannel(fromGlobalId(id).id)
    return { ...channel, id }
  }
}
function getProduct (id) {
  id = fromGlobalId(id).id
  return collection(PRODUCT_VIEW).findOne({ id })
}
function refetchProduct (field = 'id') {
  return async (source, args, { application }) => {
    const id = args[field] || source[field]
    const channel = await application.getProduct(fromGlobalId(id).id)
    return { ...channel, id }
  }
}

exports.resolvers = resolvers
