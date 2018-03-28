const assert = require('assert')
const toEvent = require('../../../adapters/BaseEvent')

// Query
exports.get = (viewer, { event }) => {
  return event
}
exports.find = (viewer, { events = [] }) => {
  return events
    .map(event => this.get(viewer, { event }))
    .filter(Boolean)
}

// Mutation
exports.create = (viewer, { event }) => {
  if (!viewer) throw new Error('Unauthorized')
  return [
    toEvent('EventCreated', event)
  ]
}

exports.cancel = (viewer, { event }) => {
  if (!viewer) throw new Error('Unauthorized')
  assert(event, 'Cannot cancel a non-existent event')
  assert(!event.cancelled, 'Cannot cancel a cancelled event')
  return [
    toEvent('EventCancelled', event)
  ]
}

exports.reschedule = (viewer, { event, start, end, doorsOpen }) => {
  if (!viewer) throw new Error('Unauthorized')
  const now = Date.now()
  assert(!event.cancelled, 'Cannot reschedule a cancelled event')
  assert(now > start, 'Cannot schedule an event in the past')
  assert(!end || start < end, 'End time cannot be before start time')
  assert(!doorsOpen || doorsOpen < start, 'Doors cannot open after show begins')

  return [
    toEvent('EventRescheduled', { id: event.id, start, end, doorsOpen })
  ]
}
