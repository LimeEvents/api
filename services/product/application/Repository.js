const assert = require('assert')

const AWS = require('aws-sdk')
const sns = new AWS.SNS({ apiVersion: '2010-03-31' })
const db = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  region: process.env.AWS_REGION,
  params: {
    TableName: process.env.PRODUCT_TABLE
  }
})

const TOPIC_MAP = {
  ProductAdded: process.env.PRODUCT_ADDED_TOPIC,
  ProductUpdated: process.env.PRODUCT_UPDATED_TOPIC,
  ProductRemoved: process.env.PRODUCT_REMOVED_TOPIC
}

class ProductRepository {
  async find ({ cursor, limit = 50 }) {
    const { Items } = await db.scan({
      ExclusiveStartKey: cursor,
      Limit: limit
    }).promise()
    return Items || []
  }

  async get (id) {
    const { Item } = await db.get({ Key: { id } }).promise()
    return Item || null
  }

  async add (product) {
    await db.put({ Item: product }).promise()
    await this.emit('ProductAdded', product)
    return { id: product.id }
  }

  async update (updates) {
    const product = await this.get(updates.id)
    await db.put({ Item: { ...product, ...updates } }).promise()
    await this.emit('ProductUpdated', updates)
    return { id: updates.id }
  }

  async remove (id) {
    await db.delete({ Key: id }).promise()
    await this.emit('ProductRemoved', { id })
    return { id }
  }

  async emit (_type, payload) {
    const TopicArn = TOPIC_MAP[_type]
    if (!TopicArn) {
      console.warn(`Event not emitted. Missing topic for "${_type}"`)
      return
    }
    assert(payload.id, 'Emitted events must include an "id" field')
    await sns
      .publish({
        Message: JSON.stringify({
          ...payload,
          _type,
          _timestamp: Date.now()
        }),
        TopicArn
      })
      .promise()
  }
}

exports.Repository = ProductRepository
