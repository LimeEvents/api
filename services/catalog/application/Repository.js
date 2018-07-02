const assert = require('assert')
const memoize = require('lodash.memoize')
const Dataloader = require('dataloader')

const AWS = require('aws-sdk')
const sns = new AWS.SNS({ apiVersion: '2010-03-31' })

const tables = {
  product: process.env.PRODUCT_TABLE,
  channel: process.env.CHANNEL_TABLE,
  variant: process.env.VARIANT_TABLE,
  channelProducts: process.env.CHANNEL_PRODUCT_TABLE,
  productVariants: process.env.PRODUCT_VARIANT_TABLE
}
const TOPIC_MAP = {
  ProductAdded: process.env.PRODUCT_ADDED_TOPIC,
  ProductUpdated: process.env.PRODUCT_UPDATED_TOPIC,
  ProductRemoved: process.env.PRODUCT_REMOVED_TOPIC
}

const db = memoize(table => new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  region: process.env.AWS_REGION,
  params: {
    TableName: tables[table]
  }
}))

class ProductRepository {
  constructor () {
    const globalDb = new AWS.DynamoDB.DocumentClient({
      apiVersion: '2012-08-10',
      region: process.env.AWS_REGION
    })
    this.dataloader = new Dataloader(async ids => {
      const split = ids.map(id => id.split(':'))
      const RequestItems = split
        .reduce((prev, [type, id]) => {
          type = tables[type]
          if (!prev[type]) prev[type] = { Keys: [] }
          prev[type].Keys.push({ id })
          return prev
        }, {})
      const { Responses } = await globalDb.batchGet({ RequestItems }).promise()
      // TODO: find quicker algorithm for matching with request ID
      return split.map(([ type, id ]) => {
        return Responses[tables[type]].find((item) => item.id === id)
      })
    }, {
      // cacheKeyFn: (type, id) => {
      //   return `${type}:${id}`
      // }
    })
  }
  async findChannels ({ cursor, limit = 50 }) {
    const { Items } = await db('channel').scan({
      ExclusiveStartKey: cursor,
      Limit: limit
    }).promise()
    return Items || []
  }

  async findProducts ({ cursor, limit = 50 }) {
    const { Items } = await db('product').scan({
      ExclusiveStartKey: cursor,
      Limit: limit
    }).promise()
    return Items || []
  }

  async addProductVariant (variant) {
    await db('variant').put({ Item: variant }).promise()
    await db('productVariants')
      .put({
        Item: {
          variantId: variant.id,
          productId: variant.productId
        }
      })
      .promise()
    await this.emit('ProductVariantAdded', variant)
    return { id: variant.productId, variantId: variant.id }
  }

  async removeProductVariant ({ variantId, productId }) {
    await db('variant').delete({ Key: { id: variantId } }).promise()
    await db('productVariants')
      .delete({
        Key: {
          variantId,
          productId
        }
      })
      .promise()
    await this.emit('ProductVariantRemoved', { variantId, productId })
    return { id: productId, variantId }
  }

  async listProductVariantIds ({ id, cursor, limit = 50 }) {
    const { Items } = await db('productVariants')
      .query({
        KeyConditionExpression: 'productId = :hkey',
        ExpressionAttributeValues: {
          ':hkey': id
        }
      })
      .promise()
    return Items.map(({ variantId }) => variantId)
  }

  async addChannel (channel) {
    await db('channel').put({ Item: channel }).promise()
    await this.emit('ChannelAdded', channel)
    return { id: channel.id }
  }

  async listChannelProductIds ({ id, cursor, limit }) {
    const { Items } = await db('channelProducts')
      .query({
        KeyConditionExpression: 'channelId = :hkey',
        ExpressionAttributeValues: {
          ':hkey': id
        }
      })
      .promise()
    return Items.map(({ productId }) => productId)
  }

  async enableChannel ({ id, enabled }) {
    const channel = await this.getChannel(id)
    await db('channel').put({ Item: { ...channel, enabled, disabled: null } }).promise()
    await this.emit('ChannelEnabled', { id, enabled })
    return { id }
  }

  async disableChannel ({ id, disabled }) {
    const channel = await this.getChannel(id)
    await db('channel').put({ Item: { ...channel, enabled: null, disabled } }).promise()
    await this.emit('ChannelDisabled', { id, disabled })
    return { id }
  }

  async updateChannel ({ id, name, metadata }) {
    const channel = await this.getChannel(id)
    await db('channel').put({ Item: { ...channel, name, metadata } }).promise()
    await this.emit('ChannelUpdated', { id, name, metadata })
    return { id }
  }

  async removeChannel ({ id }) {
    await db('channel').delete({ Key: { id } }).promise()
    await this.emit('ChannelRemoved', { id })
    return { id }
  }

  async publishChannelProduct ({ id, productId }) {
    await db('channelProducts').put({ Item: { channelId: id, productId } }).promise()
    await this.emit('ChannelProductPublished', { id, productId })
    return { id }
  }

  async unpublishChannelProduct ({ id, productId }) {
    const results = await db('channelProducts')
      .delete({ Key: {
        channelId: id,
        productId
      }})
      .promise()
    console.log(results)
    await this.emit('ChannelProductUnpublished', { id, productId })
    return { id }
  }

  async getProduct (id) {
    const product = await this.dataloader.load(`product:${id}`)
    return product || null
  }

  async getVariant (id) {
    const variant = await this.dataloader.load(`variant:${id}`)
    return variant || null
  }

  async getChannel (id) {
    const channel = await this.dataloader.load(`channel:${id}`)
    return channel || null
  }

  async addProduct (product) {
    await db('product').put({ Item: product }).promise()
    await this.emit('ProductAdded', product)
    return { id: product.id }
  }

  async updateProduct (updates) {
    const product = await this.getProduct(updates.id)
    await db('product').put({ Item: { ...product, ...updates } }).promise()
    await this.emit('ProductUpdated', updates)
    return { id: updates.id }
  }

  async removeProduct (id) {
    await db('product').delete({ Key: { id } }).promise()
    await this.emit('ProductRemoved', { id })
    return { id }
  }

  async save (events) {
    // TODO: Save events
    await Promise.all(
      events.map(event => this.emit(event._type, event))
    )
  }

  async emit (_type, payload) {
    const TopicArn = TOPIC_MAP[_type]
    const Message = JSON.stringify({
      ...payload,
      _type,
      _timestamp: Date.now()
    })
    console.log('MESSAGE', Message)
    if (!TopicArn) {
      console.warn(`Event not emitted. Missing topic for "${_type}"`)
      return
    }
    assert(payload.id, 'Emitted events must include an "id" field')
    await sns
      .publish({
        Message,
        TopicArn
      })
      .promise()
  }
}

exports.Repository = ProductRepository
