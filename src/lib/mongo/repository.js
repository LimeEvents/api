const Monk = require('monk')
const ESRepository = require('../ESRepository')
const { Readable, Writable } = require('./stream')

module.exports = class MongoRepository extends ESRepository {
  constructor (name, reducer = (src, evt) => src, emitter) {
    super(name, reducer, emitter)
    this.db = new Monk(process.env.MONGODB_URL).get(name, { castIds: false })
  }

  read (params = {}) {
    return new Readable(this.db, {
      start: new Date(0).getTime(),
      end: Date.now(),
      ...params
    })
  }

  write () {
    return new Writable(this.db, this.name)
  }
}
