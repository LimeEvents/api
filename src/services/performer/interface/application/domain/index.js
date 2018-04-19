const assert = require('assert')
const uuid = require('uuid')
const { Event } = require('@vivintsolar/repository')

module.exports = {
  get (viewer, { performer }) {
    return performer
  },
  find (viewer, { performers }) {
    return performers
  },
  register (viewer, { performer }) {
    assert(viewer, 'Unauthenticated')
    assert(any(viewer.roles, ['admin', 'system', 'administrator']), 'Unauthorized')
    if (!performer.id) performer = { id: uuid.v4(), ...performer }
    return [
      new Event('PerformerRegistered', performer)
    ]
  },
  update (viewer, { performer, update }) {

  },
  remove (viewer, { performer }) {

  }
}

function any (roles, necessary) {
  return necessary.some(role => roles.includes(role))
}
