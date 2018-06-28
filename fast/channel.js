require('dotenv').load()
const { fromGlobalId, toGlobalId, connectionFromArray } = require('graphql-relay')
const assert = require('assert')
const memoize = require('lodash.memoize')
const Monk = require('monk')
const uuid = require('uuid/v4')
const gql = require('graphql-tag')

const connection = memoize(url => new Monk(url))
const collection = memoize(name => connection(process.env.MONGODB_URL).get(name))

const CHANNEL_SOURCE = 'channel.source'
const CHANNEL_VIEW = 'channel.view'
const PRODUCT_VIEW = 'product.view'

const definition = gql`
  extend type Query {
    channel(id: ID!): Channel
    channels(first: Int, last: Int, before: String, after: String): ChannelConnection!
  }

  type ChannelConnection {
    edges: [ ChannelEdge! ]!
    pageInfo: PageInfo
  }
  type ChannelEdge {
    node: Channel
    cursor: String
  }
  type Channel {
    id: ID!
    name: String!

    metadata: JSON!

    created: DateTime!
    updated: DateTime!

    products: ProductConnection!

    enabled: DateTime
    disabled: DateTime
    removed: DateTime
  }

  extend type Mutation {
    addChannel(input: AddChannelInput!): AddChannelResponse
    updateChannel(input: UpdateChannelInput!): UpdateChannelResponse
    enableChannel(input: EnableChannelInput!): EnableChannelResponse
    disableChannel(input: DisableChannelInput!): DisableChannelResponse
    publishChannelProduct(input: PublishChannelProductInput!): PublishChannelProductResponse
    unpublishChannelProduct(input: UnpublishChannelProductInput!): UnpublishChannelProductResponse
    removeChannel(input: RemoveChannelInput!): RemoveChannelResponse
  }

  input AddChannelInput {
    clientMutationId: ID!
    name: String!
    metadata: JSON
  }
  type AddChannelResponse {
    clientMutationId: ID!
    channel: Channel!
  }

  input UpdateChannelInput {
    clientMutationId: ID!
    id: ID!
    name: String
    metadata: JSON
  }
  type UpdateChannelResponse {
    clientMutationId: ID!
    channel: Channel!
  }

  input EnableChannelInput {
    clientMutationId: ID!
    id: ID!
    date: DateTime
  }
  type EnableChannelResponse {
    clientMutationId: ID!
    channel: Channel!
  }

  input DisableChannelInput {
    clientMutationId: ID!
    id: ID!
    date: DateTime
  }
  type DisableChannelResponse {
    clientMutationId: ID!
    channel: Channel!
  }

  input PublishChannelProductInput {
    clientMutationId: ID!
    id: ID!
    productId: ID!
    date: DateTime
  }
  type PublishChannelProductResponse {
    clientMutationId: ID!
    product: Product!
    channel: Channel!
  }

  input UnpublishChannelProductInput {
    clientMutationId: ID!
    id: ID!
    productId: ID!
    date: DateTime
  }
  type UnpublishChannelProductResponse {
    clientMutationId: ID!
    product: Product!
    channel: Channel!
  }

  input RemoveChannelInput {
    clientMutationId: ID!
    id: ID!
  }
  type RemoveChannelResponse {
    clientMutationId: ID!
    channel: Channel!
  }
`

const resolvers = {
  Query: {
    channel: refetchChannel(),
    async channels (source, args, { viewer }) {
      const channels = await collection(CHANNEL_VIEW).find({})
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
    async addChannel (source, { input: { clientMutationId, ...input } }, { viewer }) {
      assert(viewer, 'Unauthenticated')
      assert(viewer.roles.includes('administrator'))
      const id = uuid()
      const now = Date.now()
      await collection(CHANNEL_SOURCE).insert([{
        id,
        productIds: [],
        ...input,
        _timestamp: now,
        _type: 'ChannelAdded'
      }])
      await collection(CHANNEL_VIEW).insert({ id, ...input, created: now, enabled: now, updated: now })
      return { clientMutationId, id }
    },
    async enableChannel (source, { input: { clientMutationId, id, start } }, { viewer }) {
      assert(viewer, 'Unauthenticated')
      assert(viewer.roles.includes('administrator'))
      id = fromGlobalId(id).id
      const now = Date.now()
      const channel = await getChannel(id)
      assert(channel, 'Channel does not exist')
      assert(!channel.removed, 'Channel has been removed')
      assert(!channel.enabled, 'Channel is already enabled')
      await collection(CHANNEL_SOURCE).insert([{
        id,
        start,
        _timestamp: now,
        _type: 'ChannelEnabled'
      }])
      await collection(CHANNEL_VIEW).update({ id }, { $set: { enabled: now, disabled: null, updated: now } })
      return { clientMutationId, id }
    },
    async disableChannel (source, { input: { clientMutationId, id, start } }, { viewer }) {
      assert(viewer, 'Unauthenticated')
      assert(viewer.roles.includes('administrator'))
      id = fromGlobalId(id).id
      const channel = await getChannel(id)
      assert(channel, 'Channel does not exist')
      assert(!channel.removed, 'Channel has been removed')
      assert(!channel.disabled, 'Channel is already disabled')
      const now = Date.now()
      await collection(CHANNEL_SOURCE).insert([{
        id,
        start,
        _timestamp: now,
        _type: 'ChannelDisabled'
      }])
      await collection(CHANNEL_VIEW).update({ id }, { $set: { disabled: now, enabled: null, updated: now } })
      return { clientMutationId, id }
    },
    async updateChannel (source, { input: { clientMutationId, id, ...input } }, { viewer }) {
      assert(viewer, 'Unauthenticated')
      assert(viewer.roles.includes('administrator'))
      id = fromGlobalId(id).id
      const now = Date.now()
      const channel = await getChannel(id)
      assert(channel, 'Channel does not exist')
      assert(!channel.removed, 'Channel has been removed')
      await collection(CHANNEL_SOURCE).insert([{
        id,
        productIds: [],
        ...input,
        _timestamp: now,
        _type: 'ChannelUpdated'
      }])
      await collection(CHANNEL_VIEW).update({ id }, { $set: { updated: now, ...input } })
      return { clientMutationId, id }
    },
    async removeChannel (source, { input: { clientMutationId, id, ...input } }, { viewer }) {
      assert(viewer, 'Unauthenticated')
      assert(viewer.roles.includes('administrator'))
      id = fromGlobalId(id).id
      const now = Date.now()
      const channel = await getChannel(id)
      assert(channel, 'Channel does not exist')
      assert(!channel.removed, 'Channel has already been removed')
      assert(channel.disabled, 'Channel must be disabled before it can be removed')
      await collection(CHANNEL_SOURCE).insert([{
        id,
        ...input,
        _timestamp: now,
        _type: 'ChannelRemoved'
      }])
      await collection(CHANNEL_VIEW).update({ id }, { $set: { updated: now, removed: now } })
      return { clientMutationId, id }
    },
    async publishChannelProduct (source, { input: { clientMutationId, id, productId } }, { viewer }) {
      assert(viewer, 'Unauthenticated')
      id = fromGlobalId(id).id
      const channel = await getChannel(id)
      assert(channel, 'Channel does not exist')
      const now = Date.now()
      await collection(CHANNEL_SOURCE).insert({
        id,
        productId,
        _timestamp: now,
        _type: 'ChannelProductPublished'
      })
      const productIds = channel.productIds || []
      productIds.push(productId)
      await collection(CHANNEL_VIEW).update({ id }, { $set: { productIds } })
      return { clientMutationId, id, productId }
    },
    async unpublishChannelProduct (source, { input: { clientMutationId, id, productId } }, { viewer }) {
      assert(viewer, 'Unauthenticated')
      id = fromGlobalId(id).id
      const channel = await getChannel(id)
      assert(channel, 'Channel does not exist')
      assert(channel.productIds.includes(productId), 'Product is not published to this channel')
      const now = Date.now()
      await collection(CHANNEL_SOURCE).insert({
        id,
        productId,
        _timestamp: now,
        _type: 'ChannelProductUnpublished'
      })
      let productIds = channel.productIds || []
      const idx = productIds.indexOf(productId)
      productIds = productIds.splice(idx, 1)
      console.log(productIds, idx)
      await collection(CHANNEL_VIEW).update({ id }, { $set: { productIds } })
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
  RemoveChannelResponse: {
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
  return async (source, args, { viewer }) => {
    return getChannel(args[field] || source[field])
  }
}
function getProduct (id) {
  id = fromGlobalId(id).id
  return collection(PRODUCT_VIEW).findOne({ id })
}
function refetchProduct (field = 'id') {
  return async (source, args, { viewer }) => {
    return getProduct(args[field] || source[field])
  }
}

exports.definition = definition
exports.resolvers = resolvers