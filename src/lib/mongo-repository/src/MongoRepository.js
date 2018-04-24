const assert = require('assert')
const Monk = require('monk')
const { Repository } = require('@vivintsolar/event-source-repository')
const { Readable, Writable } = require('./MongoStream')
const RESTRICTED_KEYS = ['start', 'end']
const memo = require('lodash.memoize')

const connect = memo((url) => new Monk(url))

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
    this.db = connect(url)
    this.source = this.db.get(`${name}_source`, { castIds: false })
    this.view = this.db.get(`${name}_view`, { castIds: false })
  }

  async save (events) {
    const { id } = await super.save(events)
    // Update view for quick list lookups
    const entity = await this.get(id)
    if (entity) {
      entity._id = id
      await this.view.update({ _id: id }, entity, { upsert: true })
    } else {
      await this.view.remove({ _id: id })
    }

    return { id }
  }

  async rebuildIndex () {
    const ids = await this.source.distinct('id')
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      const entity = await this.get(id)
      await this.view.findOneAndUpdate({ _id: id }, entity)
    }
    console.info('Successfully rebuilt index')
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
