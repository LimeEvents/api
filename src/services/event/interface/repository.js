const emitter = require('../../../lib/emitter')
const Repo = require('../../../lib/mongo/repository')

exports.reducer = (src = {}, event) => {
  const entity = Object.assign({
    feeDistribution: 'Location'
  }, src)
  const fn = {
    EventCancelled () {
      entity.cancelled = event.meta.timestamp
      return entity
    },
    EventCreated () {
      entity.id = event.meta.id
      entity.name = event.name
      entity.image = event.image
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
  }[event.meta.type]
  if (typeof fn === 'function') return fn()
  console.warn(`Invalid event type: "${event.meta.type}"`)
  return src
}
exports.repository = new Repo('event_source', exports.reducer, emitter)
