const assert = require('assert')

const domain = (viewer, { event }) => {
  assert(event, 'Event does not exist.')
  return event
}

const application = (repo, services) => async (viewer, id) => {
  const event = await repo.get(id)
  return domain(viewer, { event })
}

const reducer = {
  EventCancelled (entity, event) {
    entity.cancelled = event._timestamp
    return entity
  },
  EventCreated (entity, event) {
    entity.id = event.id
    entity.locationId = event.locationId
    entity.inventory = {
      capacity: event.capacity || 0,
      reserved: event.reserved || 0,
      available: event.available || 0,
      sold: event.sold || 0
    }
    entity.externalIds = event.externalIds || []
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
  EventRescheduled (entity, event) {
    entity.start = event.start
    entity.end = event.end
    entity.doorsOpen = event.doorsOpen
    return entity
  }
}

exports.application = application
exports.domain = domain
exports.reducer = reducer
