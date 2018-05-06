const assert = require('assert')
const uuid = require('uuid/v4')
const { Event } = require('@vivintsolar/repository')

const THIRTY = 1000 * 60 * 30
const NINETY = THIRTY * 3

// Query
exports.find = (viewer, { events = [] }) => {
  return events
    .map(event => this.get(viewer, { event }))
    .filter(Boolean)
}

// Mutation
exports.create = (viewer, { event }) => {
  assert(viewer, 'Unauthenticated')
  roles(viewer, ['administrator', 'system'])
  if (!event.id) event = { id: uuid(), ...event }

  if (!event.end) {
    event.end = event.start + NINETY
  }
  if (!event.doorsOpen) {
    event.doorsOpen = event.start - THIRTY
  }
  assert(event.start > Date.now(), 'Event cannot start in the past.')
  assert(event.start < event.end, 'End date cannot be before start date')
  assert(event.doorsOpen < event.start, 'Doors cannot open after the show starts')

  return [
    new Event('EventCreated', event)
  ]
}

exports.cancel = (viewer, { event }) => {
  assert(viewer, 'Unauthenticated')
  roles(viewer, ['administrator', 'system'])
  assert(event, 'Cannot cancel a non-existent event')
  assert(!event.cancelled, 'Cannot cancel a cancelled event')
  return [
    new Event('EventCancelled', { id: event.id })
  ]
}

exports.reschedule = (viewer, { event, start, end, doorsOpen }) => {
  assert(viewer, 'Unauthenticated')
  roles(viewer, ['administrator', 'system'])
  assert(event, 'Cannot reschedule event. Event does not exist.')
  if (!end) {
    end = event.end - event.start + start
  }
  if (!doorsOpen) {
    doorsOpen = event.start - event.doorsOpen - start
  }
  assert(start > Date.now(), 'Cannot reschedule event in the past.')
  assert(start < end, 'End date cannot be before start date')
  assert(doorsOpen < start, 'Doors cannot open after the show starts')
  assert(!event.cancelled, 'Cannot reschedule a cancelled event')

  return [
    new Event('EventRescheduled', { id: event.id, start, end, doorsOpen })
  ]
}

function roles ({ roles }, any) {
  return any.some((role) => roles.includes(role))
}
