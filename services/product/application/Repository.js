const assert = require('assert')
const EventEmitter = require('events')

const Dataloader = require('dataloader')
const Monk = require('monk')
const Observable = require('zen-observable')
const QuickLru = require('quick-lru')
const memoize = require('lodash.memoize')

const { reduce } = require('./reducer')

const connection = memoize(url => new Monk(url))
const collection = memoize(name => connection(process.env.MONGODB_URL).get(name))

const PRODUCT_COLLECTION = 'catalog.product'
const PRODUCT_SOURCE = 'catalog.product.source'

class ProductRepository {
  constructor () {
    this.emitter = new EventEmitter()
    this.loader = new Dataloader(async ids => {
      const stream = this.streamMany(ids)
      return Promise.all(
        ids.map(id =>
          new Promise((resolve, reject) =>
            stream
              .reduce(reduce, {})
              .subscribe(resolve, reject)
          )
        )
      )
    }, { cacheMap: new QuickLru({ maxSize: 100 }) })
    const update = (event) => this.loader.clear(event.id).prime(event.id, this.update(event))
    this.emitter
      .on('ProductAdded', update)
      .on('ProductUpdated', update)
      .on('ProductRemoved', update)
  }

  async update (event) {
    const id = event.id
    const entity = await collection(PRODUCT_COLLECTION).findOne({ id })
    const result = reduce(entity || {}, event)
    await collection(PRODUCT_COLLECTION).update({ id }, result, { upsert: true })
    return result
  }
  async health () {
    console.log('mongodb', process.env.MONGODB_URL)
    try {
      Monk(process.env.MONGODB_URL).catch(ex => console.error(JSON.stringify(ex, null, 2)))
    } catch (ex) {
      console.log('blah', ex)
    }
    const start = Date.now()
    await collection(PRODUCT_COLLECTION).findOne({})
    return { mongo: Date.now() - start }
  }

  stream (id, events = []) {
    return new Observable((observer) => {
      collection(PRODUCT_SOURCE)
        .find({ id })
        .each((event) => observer.next(event))
        .then(() => observer.complete())
        .catch(ex => observer.error(ex))
    }).concat(Observable.from(events))
  }

  streamMany (ids, events = []) {
    return new Observable((observer) => {
      collection(PRODUCT_SOURCE)
        .find({ id: { $in: ids } })
        .each((event) => observer.next(event))
        .then(() => observer.complete())
        .catch(ex => observer.error(ex))
    }).concat(Observable.from(events))
  }

  async get (id, force = false) {
    if (force) this.loader.clear(id)
    const product = await this.loader.load(id)
    if (Object.keys(product).length) return product
    this.loader.clear(id)
    return null
  }

  async save (events = []) {
    assert(Array.isArray(events), 'Cannot call save without an array')
    assert(events.length, 'Must save at least one event')

    await collection(PRODUCT_SOURCE).insert(events)
    events.forEach(event => this.emitter.emit(event._type, event))
    return { id: events[0].id }
  }
}

exports.Repository = ProductRepository
