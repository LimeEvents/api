
const memo = require('lodash.memoize')
const { Repository } = require('@vivintsolar/mongo-repository')

const reducer = (src = {}, event) => {
  const entity = Object.assign({
    feeDistribution: 100
  }, src)
  const fn = {
    EventCancelled () {
      entity.cancelled = event._timestamp
      return entity
    },
    EventCreated () {
      entity.id = event.id
      entity.locationId = event.locationId
      entity.inventory = event.inventory

      entity.performerIds = event.performerIds
      entity.name = event.name
      entity.image = event.image
      entity.video = event.video
      entity.caption = event.caption
      entity.description = event.description
      entity.externalIds = event.externalIds || []

      entity.doorsOpen = event.doorsOpen
      entity.start = event.start
      entity.end = event.end
      entity.price = event.price
      entity.available = event.available
      entity.contentRating = event.contentRating
      entity.minimumAge = event.minimumAge || 0
      entity.notes = event.notes || []
      return entity
    },
    EventRescheduled () {
      entity.start = event.start
      entity.end = event.end
      entity.doorsOpen = event.doorsOpen
      return entity
    }
  }[event._type]
  if (typeof fn === 'function') return fn()
  console.warn(`Invalid event type: "${event._type}"`)
  return src
}

class EventWriteRepository extends Repository {
  constructor (tenantId, emitter) {
    super({ name: 'event', reducer, tenantId })
    this.emitter = emitter
  }

  async save (events) {
    const results = await super.save(events)
    events.forEach((event) => this.emitter.emit(event._type, event))
    return results
  }
}
exports.repository = memo((tenantId, emitter) => new EventWriteRepository(tenantId, emitter))
