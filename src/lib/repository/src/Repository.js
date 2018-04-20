
const assert = require('assert')
const EventEmitter = require('events')
const { filter } = require('graphql-anywhere')
const { parse } = require('graphql')
const memo = require('lodash.memoize')

const memoParse = memo(parse)
const DEFAULT_SELECTION = memoParse('{ id }')
const DEFAULT_FIND = async () => { throw new Error('Not implemented') }

exports.Repository = class Repository {
  constructor (emitter = new EventEmitter()) {
    this.emitter = emitter
    assert(typeof this.get === 'function', '`get` must be a function')
    assert(typeof this.save === 'function', '`save` must be a function')

    const _get = this.get.bind(this)
    const _save = this.save.bind(this)
    if (!this.find) this.find = DEFAULT_FIND
    const _find = this.find.bind(this)

    // TODO: Potentially add optional redis cache for quick lookups
    this.get = async (id, selectionSet = DEFAULT_SELECTION) => {
      assert(id, 'Must provide an ID to load entity')
      const results = await _get(id)
      return filter(selectionSet, results)
    }

    this.find = async (params = {}, selectionSet = DEFAULT_SELECTION) => {
      const results = await _find(params)
      if (typeof selectionSet === 'string') selectionSet = memoParse(selectionSet)
      return results.map(item => filter(selectionSet, item))
    }

    this.save = async (events) => {
      assert(Array.isArray(events), 'Repository.save() takes an array of events')
      assert(events.length, 'Repository.save() must receive at least one event')
      assert(events.every(event => typeof event === 'object'), 'Events must be objects')
      const id = events[0].id
      if (events.length > 1) {
        events.every((event) => {
          assert(event.id, 'Each event must have an `id`')
          assert(event.id === id, 'All events passed to Repository.save must have the same ID')

          assert(typeof event._type === 'string', 'Each event must have a `_type`')
          assert(typeof event._timestamp === 'number', 'Each event must have a `_timestamp`')
        })
      }
      // Persist events
      await _save(events)

      // Return a list of unique IDs that have changed
      events.forEach((event) => {
        // Emit (if anyone is listening) that something has happened
        this.emitter.emit(event.type, event)
      })
      return { id }
    }
  }
}
