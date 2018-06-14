const Monk = require('monk')
const memoize = require('lodash.memoize')

const connection = memoize(url => new Monk(url))
const collection = memoize(name => connection(process.env.MONGODB_URL).get(name))

const PRODUCT_COLLECTION = 'catalog.product'

class QueryRepository {
  async health () {
    const start = Date.now()
    await collection(PRODUCT_COLLECTION).findOne({})
    return { mongo: Date.now() - start }
  }

  async get (id) {
    return {
      id,
      name: 'Black',
      productId: '1234',
      created: Date.now(),
      updated: Date.now(),
      metadata: {}
    }
  }
}

exports.Repository = QueryRepository
