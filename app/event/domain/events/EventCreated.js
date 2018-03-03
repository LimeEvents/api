const assert = require('assert')
const uuid = require('uuid')
const Base = require('@nerdsauce/adapters/BaseEvent')

module.exports = class EventCreated extends Base {
  constructor (body) {
    body.id = uuid.v4()
    super(body.id, body)
    this.meta.type = 'EventCreated'
    assert(typeof this.locationId === 'string', 'EventCreated: "locationId" must be a ID!')
    assert(Array.isArray(this.performerIds), 'EventCreated: "performerIds" must be a [ ID! ]')
    assert(typeof this.start === 'number', 'EventCreated: "start" must be a DateTime!')
    assert(typeof this.price === 'number', 'EventCreated: "price" must be a Float!')
    assert(typeof this.available === 'number', 'EventCreated: "available" must be a Int!')
    assert(typeof this.ageRange === 'string', 'EventCreated: "ageRange" must be a String')
    assert(typeof this.minimumAge === 'number', 'EventCreated: "minimumAge" must be a Int')
  }
}
