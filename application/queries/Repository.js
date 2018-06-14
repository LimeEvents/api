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
}

exports.Repository = QueryRepository
