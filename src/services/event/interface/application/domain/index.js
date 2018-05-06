const assert = require('assert')
const { Event } = require('@vivintsolar/repository')

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
