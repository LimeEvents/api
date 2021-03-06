const assert = require('assert')
const memoize = require('lodash.memoize')
const Dataloader = require('dataloader')
const QuickLru = require('quick-lru')

const AWS = require('aws-sdk')
const sns = new AWS.SNS({ apiVersion: '2010-03-31' })

const tables = {
  product: process.env.PRODUCT_TABLE,
  channel: process.env.CHANNEL_TABLE,
  offer: process.env.OFFER_TABLE,
  channelProducts: process.env.CHANNEL_PRODUCT_TABLE
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
      cacheMap: new QuickLru({ maxSize: 500 })
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
      Limit: limit,
      FilterExpression: 'attribute_not_exists(parentId)'
    }).promise()
    return Items || []
  }

  async addProductOffer (offer) {
    await db('offer').put({ Item: offer }).promise()
    await this.emit('ProductOfferAdded', offer)
    this.dataloader.clear(`offer:${offer.id}`)
    return { id: offer.productId, offerId: offer.id }
  }

  async removeProductOffer (offer) {

  }

  async updateProductOffer (offer) {

  }

  async getProductOffer (id) {
    const offer = await this.dataloader.load(`offer:${id}`)
    return offer || null
  }

  async listProductOfferIds ({ id, cursor, limit = 50 }) {
    if (cursor) cursor = JSON.parse(cursor)
    const { Items, LastEvaluatedKey } = await db('offer')
      .query({
        IndexName: 'product-index',
        KeyConditionExpression: 'productId = :hkey',
        ExpressionAttributeValues: {
          ':hkey': id
        },
        ExclusiveStartKey: cursor,
        Limit: limit
      })
      .promise()
    return {
      list: Items,
      cursor: JSON.stringify(LastEvaluatedKey)
    }
  }

  async listProductVariantIds ({ id, cursor, limit = 50 }) {
    if (cursor) cursor = JSON.parse(cursor)
    const { Items, LastEvaluatedKey } = await db('product')
      .query({
        IndexName: 'parent-index',
        KeyConditionExpression: 'parentId = :hkey',
        ExpressionAttributeValues: {
          ':hkey': id
        },
        ExclusiveStartKey: cursor,
        Limit: limit
      })
      .promise()
    return {
      list: Items,
      cursor: JSON.stringify(LastEvaluatedKey)
    }
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
    this.dataloader.clear(`channel:${id}`)
    await this.emit('ChannelEnabled', { id, enabled })
    return { id }
  }

  async disableChannel ({ id, disabled }) {
    const channel = await this.getChannel(id)
    await db('channel').put({ Item: { ...channel, enabled: null, disabled } }).promise()
    this.dataloader.clear(`channel:${id}`)
    await this.emit('ChannelDisabled', { id, disabled })
    return { id }
  }

  async updateChannel ({ id, name, metadata }) {
    const channel = await this.getChannel(id)
    await db('channel').put({ Item: { ...channel, name, metadata } }).promise()
    this.dataloader.clear(`channel:${id}`)
    await this.emit('ChannelUpdated', { id, name, metadata })
    return { id }
  }

  async removeChannel ({ id }) {
    await db('channel').delete({ Key: { id } }).promise()
    this.dataloader.clear(`channel:${id}`)
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
    this.dataloader.clear(`product:${updates.id}`)
    await this.emit('ProductUpdated', updates)
    return { id: updates.id }
  }

  async removeProduct (id) {
    await db('product').delete({ Key: { id } }).promise()
    this.dataloader.clear(`product:${id}`)
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
