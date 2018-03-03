const Base = require('@nerdsauce/adapters/BaseEvent')

module.exports = class EventCancelled extends Base {
  constructor ({ id }) {
    super({ id })
    this.meta.type = 'EventCancelled'
  }
}
