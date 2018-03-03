const Repo = require('@nerdsauce/adapters/dynamo/repository')

exports.reducer = (src = {}, event) => {
  const entity = Object.assign({}, src)
  return {
    EventCancelled () {
      entity.cancelled = event.timestamp
      return entity
    },
    EventCreated () {
      const { payload } = event
      entity.id = event.id
      entity.locationId = payload.locationId
      entity.performerIds = payload.performerIds
      entity.start = payload.start
      entity.end = payload.end
      entity.price = payload.price
      entity.available = payload.available
      entity.ageRange = payload.ageRange
      entity.minimumAge = payload.minimumAge
      entity.notes = payload.notes
      return entity
    },
    EventRescheduled () {
      const { payload } = event
      entity.start = payload.start
      entity.end = payload.end
      entity.doorsOpen = payload.doorsOpen
      return entity
    }
  }[event.type](event.type)
}
exports.repository = new Repo('Event', exports.reducer)
