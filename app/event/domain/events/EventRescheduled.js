
const Base = require('@nerdsauce/adapters/BaseEvent')

module.exports = class EventRescheduled extends Base {
  constructor ({ id, start, end, doorsOpen }) {
    super({ id, start, end, doorsOpen })
    this.meta.type = 'EventRescheduled'
  }
}
