const memo = require('lodash.memoize')
const { Repository } = require('@vivintsolar/mongo-repository')

const reducer = (src = {}, event) => {
  const entity = Object.assign({
    feeDistribution: 'Location'
  }, src)
  const fn = {
    EventCancelled () {
      entity.cancelled = event._timestamp
      return entity
    },
    EventCreated () {
      entity.id = event.id
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
  }[event._type]
  if (typeof fn === 'function') return fn()
  console.warn(`Invalid event type: "${event._type}"`)
  return src
}
exports.repository = memo((tenantId) => new Repository({ name: 'event_source', reducer, tenantId }))
