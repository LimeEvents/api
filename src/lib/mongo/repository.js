const Monk = require('monk')
const ESRepository = require('../ESRepository')
const { Readable, Writable } = require('./stream')
const RESTRICTED_KEYS = ['start', 'end']

module.exports = class MongoRepository extends ESRepository {
  constructor (name, reducer = (src, evt) => src, emitter) {
    super(name, reducer, emitter)
    this.db = new Monk(process.env.MONGODB_URL)
    this.source = this.db.get(name, { castIds: false })
    this.view = this.db.get(name.replace(/_source$/, ''), { castIds: false })
  }

  async save (events) {
    const { id } = await super.save(events)
    // Update view for quick list lookups
    const entity = await this.get(id)
    entity._id = id
    await this.view.update({ _id: id }, entity, { upsert: true })

    return { id }
  }

  async find (query = {}) {
    const base = {}
    query = Object.entries(query)
      .reduce((prev, [ key, value ]) => {
        if (Array.isArray(value)) value = { $in: value }
        if (!RESTRICTED_KEYS.includes(key)) prev[key] = value
        return prev
      }, base)
    const results = await this.view.find(query)
    return results
  }

  read (params = {}) {
    return new Readable(this.source, {
      start: new Date(0).getTime(),
      end: Date.now(),
      ...params
    })
  }

  write () {
    return new Writable(this.source, this.name)
  }
}
