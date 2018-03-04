const assert = require('assert')
const PerformerRegistered = require('./events/PerformerRegistered')

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
      new PerformerRegistered(performer)
    ]
  },
  update (viewer, { performer, update }) {

  },
  remove (viewer, { performer }) {

  }
}
