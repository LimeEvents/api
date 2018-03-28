const assert = require('assert')
const toEvent = require('../../../adapters/BaseEvent')

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
    return [
      toEvent('PerformerRegistered', performer)
    ]
  },
  update (viewer, { performer, update }) {

  },
  remove (viewer, { performer }) {

  }
}
