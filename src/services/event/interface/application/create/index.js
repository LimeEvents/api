const assert = require('assert')
const uuid = require('uuid/v4')

const THIRTY = 1000 * 60 * 30
const NINETY = THIRTY * 3

const domain = (viewer, { event, location, now }) => {
  assert(viewer, 'Unauthenticated')
  roles(viewer, ['administrator', 'system'])
  if (!event.id) event = { id: uuid(), ...event }

  if (!event.end) {
    event.end = event.start + NINETY
  }
  if (!event.doorsOpen) {
    event.doorsOpen = event.start - THIRTY
  }
  assert(event.start > now, 'Event cannot start in the past.')
  assert(event.start < event.end, 'End date cannot be before start date')
  assert(event.doorsOpen < event.start, 'Doors cannot open after the show starts')

  assert(location, 'Cannot schedule an event at a invalid location')

  const capacity = event.capacity || location.capacity || 0
  assert(capacity > 0, 'Event capacity must be greater than 0')
  event.inventory = {
    capacity,
    available: capacity,
    reserved: 0,
    sold: 0
  }

  return [{
    _type: 'EventCreated',
    _timestamp: Date.now(),
    ...event
  }]
}

const application = (repo, services) => async (viewer, event) => {
  const location = await services.location.get(viewer, event.locationId, '{ capacity }')
  return repo.save(
    domain(viewer, { event, location, now: Date.now() })
  )
}

function roles ({ roles }, any) {
  return any.some((role) => roles.includes(role))
}

exports.application = application
exports.domain = domain
