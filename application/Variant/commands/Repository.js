const Monk = require('monk')
const memoize = require('lodash.memoize')

const connection = memoize(url => new Monk(url))
const collection = memoize(name => connection(process.env.MONGODB_URL).get(name))

const VARIANT_COLLECTION = 'catalog.variant.source'

class CommandRepository {
  async getProduct (id) {
    return { id }
  }

  async findProductVariants (productId) {
    return []
  }

  async save (events) {
    await collection(VARIANT_COLLECTION).insert(events)
    return { id: events[0].id }
  }
}

exports.Repository = CommandRepository
