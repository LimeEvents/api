const assert = require('assert')
const uuid = require('uuid')
const toEvent = require('../../../lib/BaseEvent')

module.exports = {
  get (viewer, { performer }) {
    return performer
  },
  find (viewer, { performers }) {
    return performers
  },
  register (viewer, { performer }) {
    assert(viewer, 'Unauthenticated')
    assert(viewer.roles.includes('admin'), 'Unauthorized')
    if (!performer.id) performer = { id: uuid.v4(), ...performer }
    return [
      toEvent('PerformerRegistered', performer)
    ]
  },
  update (viewer, { performer, update }) {

  },
  remove (viewer, { performer }) {

  }
}
