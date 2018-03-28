const uuid = require('uuid/v4')
const assert = require('assert')

// module.exports = class Event {
//   constructor (value = {}) {
//     Object.assign(this, value)
//     assert(value.id, 'Event must include aggregate "id" field')
//     this.meta = { id: uuid.v4(), timestamp: Date.now() }
//   }
// }

module.exports = (type, src) => {
  const event = Object.assign({}, src)
  assert(event.id, 'All events must include an aggregate "id" field')
  event.meta = {
    id: event.id,
    type,
    timestamp: Date.now()
  }
  event.id = uuid()
  return event
}
