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
      entity.inventory = { capacity: event.capacity || 0 }

      entity.performerIds = event.performerIds
      entity.name = event.name
      entity.image = event.image
      entity.video = event.video
      entity.caption = event.caption
      entity.description = event.description

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
let i = 0
class EventReadRepository extends Repository {
  constructor (tenantId, emitter) {
    super({ name: 'event', reducer, tenantId })
    this.emitter = emitter
    i++
    emitter.on('OrderCreated', (event) => {
      console.log('HOLY CRAPP!!!', i, event)
    })
  }
}

exports.repository = memo((tenantId, emitter) => new EventReadRepository(tenantId, emitter))
