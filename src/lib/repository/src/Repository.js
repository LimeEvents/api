
const assert = require('assert')
const EventEmitter = require('events')
const Dataloader = require('dataloader')
const QuickLru = require('quick-lru')

exports.Repository = class Repository {
  constructor (emitter = new EventEmitter()) {
    this.emitter = emitter
    assert(typeof this.get === 'function', '`get` must be a function')
    assert(typeof this.save === 'function', '`save` must be a function')

    const _get = this.get.bind(this)
    const _save = this.save.bind(this)

    // TODO: Has the potential to cache things too long. Consider n+1 priming
    this.dataloader = new Dataloader((ids) => Promise.all(
      ids.map(id => _get(id))
    ), { cacheMap: new QuickLru({ maxSize: 1000 }) })
    this.get = (id, ...args) => args.length ? _get(id, ...args) : this.dataloader.load(id)
    this.save = async (events) => {
      const results = await _save(events)
      events.forEach((event) => this.emitter.emit(event.type, event))
      // Invalidate the cache, something changed
      this.dataloader.clear(events[0].id)
      return results
    }
  }
}
