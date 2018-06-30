const assert = require('assert')
const memoize = require('lodash.memoize')

const AWS = require('aws-sdk')
const sns = new AWS.SNS({ apiVersion: '2010-03-31' })

const tables = {
  product: process.env.PRODUCT_TABLE,
  channel: process.env.CHANNEL_TABLE
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
  async findChannels ({ cursor, limit = 50 }) {
    const { Items } = await db('channel').scan({
      ExclusiveStartKey: cursor,
      Limit: limit
    }).promise()
    return Items || []
  }

  async find ({ cursor, limit = 50 }) {
    const { Items } = await db('product').scan({
      ExclusiveStartKey: cursor,
      Limit: limit
    }).promise()
    return Items || []
  }

  async get (id) {
    const { Item } = await db('product').get({ Key: { id } }).promise()
    return Item || null
  }

  async getChannel (id) {
    const { Item } = await db('channel').get({ Key: { id } }).promise()
    return Item || null
  }

  async add (product) {
    await db('product').put({ Item: product }).promise()
    await this.emit('ProductAdded', product)
    return { id: product.id }
  }

  async update (updates) {
    const product = await this.get(updates.id)
    await db('product').put({ Item: { ...product, ...updates } }).promise()
    await this.emit('ProductUpdated', updates)
    return { id: updates.id }
  }

  async remove (id) {
    await db('product').delete({ Key: { id } }).promise()
    await this.emit('ProductRemoved', { id })
    return { id }
  }

  async addChannel (channel) {
    await db('channel').put({ Item: channel }).promise()
    await this.emit('ChannelAdded', channel)
    return { id: channel.id }
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
