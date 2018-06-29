require('dotenv').load()
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
  const channelId = id
  id = fromGlobalId(id).id
  const channel = await getChannel(id)
  assert(channel, 'Channel does not exist')
  const product = await getProduct()
  const now = Date.now()
  await collection(CHANNEL_SOURCE).insert({
    id,
    productId,
    _timestamp: now,
    _type: 'ChannelProductPublished'
  })
  const productIds = channel.productIds || []
  productIds.push(productId)
  await collection(CHANNEL_PRODUCT_LINK).insert({ id: uuid(), productId, channelId })
  return { clientMutationId, id: channelId, productId }
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
  productIds.splice(idx, 1)
  await collection(CHANNEL_VIEW).update({ id }, { $set: { productIds } })
  return { clientMutationId, id, productId }
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