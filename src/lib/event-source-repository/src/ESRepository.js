const assert = require('assert')
const { promisify } = require('util')
const { Transform } = require('stream')
const toArray = require('stream-to-array')
const onEnd = promisify(require('end-of-stream'))
const { Repository } = require('@vivintsolar/repository')

const _map = Symbol('_map')
const _reduction = Symbol('_reduction')

exports.Repository = class ESRepository extends Repository {
  constructor (name, reducer = (src, evt) => src, emitter) {
    super(emitter)
    this.name = name
    this.reducer = reducer
    assert(typeof this.read === 'function', 'Class extending ESRespository must implement `read`')
    assert(typeof this.write === 'function', 'Class extending ESRespository must implement `write`')
  }

  async save (events) {
    const stream = this.write()
    events.map(event => stream.write(event))
    stream.end()
    await onEnd(stream)
    return { id: events[0].id }
  }

  async find (params = {}) {
    const _reducer = this.reducer.bind(this)
    const list = await toArray(
      this.read(params)
        .pipe(new Transform({
          objectMode: true,
          transform (chunk, encoding, callback) {
            if (!this[_map]) this[_map] = {}
            const obj = Object.assign({}, this[_map][chunk.id] || {})
            this[_map][chunk.id] = _reducer(obj, chunk)
            callback()
          },
          flush (callback) {
            Object.values(this[_map] || {})
              .map(value => this.push(value))
            this[_map] = {}
            callback()
          }
        }))
    )
    return list
  }

  async get (id, start = 0, end = Date.now()) {
    const [ object ] = await toArray(
      this
        .read({ id, start, end })
        .pipe(reduce(this.reducer))
    )
    return object || null
  }
}

function reduce (fn, init) {
  return new Transform({
    objectMode: true,
    transform (chunk, encoding, callback) {
      this[_reduction] = fn(this[_reduction] || init, chunk)
      callback()
    },
    flush (callback) {
      this.push(this[_reduction])
      this[_reduction] = {}
      callback()
    }
  })
}
