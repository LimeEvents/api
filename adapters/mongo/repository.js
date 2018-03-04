const Monk = require('monk')
const ESRepository = require('../ESRepository')
const { Readable, Writable } = require('./stream')

module.exports = class MongoRepository extends ESRepository {
  constructor (name, reducer = (src, evt) => src) {
    super(name, reducer)
    this.db = new Monk(process.env.MONGODB_URL).get('event_source')
  }

  read (id, start = new Date(0), end = new Date()) {
    if (!id) {
      return new Readable(this.db, {})
    }
    return new Readable(this.db, {
      // id,
      // timestamp: { $gte: start, $lte: end }
    })
  }

  write () {
    return new Writable(this.db, this.name)
  }
}
