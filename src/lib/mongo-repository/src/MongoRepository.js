const assert = require('assert')
const Monk = require('monk')
const { Repository } = require('@vivintsolar/event-source-repository')
const { Readable, Writable } = require('./MongoStream')
const RESTRICTED_KEYS = ['start', 'end']

exports.Repository = class MongoRepository extends Repository {
  constructor ({
    name,
    reducer = (src, evt) => src,
    emitter,
    tenantId = 'default',
    url = process.env.MONGODB_URL
  }) {
    super(name, reducer, emitter)
    assert(url, 'MongoDB connection URL is required. Either pass `url` or set environment variable `MONGODB_URL`')
    this.db = new Monk(url)
    this.source = this.db.get(`${name}_source`, { castIds: false })
    this.view = this.db.get(`${name}_view`, { castIds: false })
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
