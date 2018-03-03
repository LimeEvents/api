const uuid = require('uuid')
const assert = require('assert')

module.exports = class Event {
  constructor (value = {}) {
    Object.assign(this, value)
    assert(value.id, 'Event must include aggregate "id" field')
    this.meta = { id: uuid.v4(), timestamp: Date.now() }
  }
}
