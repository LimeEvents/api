const assert = require('assert')

exports.Event = class Event {
  constructor (type, payload) {
    assert(typeof type === 'string', 'Field "type" must be a string')
    assert(payload.id, 'Event must always have a primary "id" field')

    Object.assign(this, payload)

    this._type = type
    this._timestamp = Date.now()
  }
}
