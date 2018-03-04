const Repo = require('@nerdsauce/adapters/mongo/repository')

exports.reducer = (src = {}, event) => {
  const entity = Object.assign({}, src)
  return {
    EventCancelled () {
      entity.cancelled = event.meta.timestamp
      return entity
    },
    EventCreated () {
      entity.id = event.id
      entity.locationId = event.locationId
      entity.performerIds = event.performerIds
      entity.start = event.start
      entity.end = event.end
      entity.price = event.price
      entity.available = event.available
      entity.ageRange = event.ageRange
      entity.minimumAge = event.minimumAge
      entity.notes = event.notes
      return entity
    },
    EventRescheduled () {
      entity.start = event.start
      entity.end = event.end
      entity.doorsOpen = event.doorsOpen
      return entity
    }
  }[event.meta.type](event.meta.type)
}
exports.repository = new Repo('Event', exports.reducer)
