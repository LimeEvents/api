const assert = require('assert')
const domain = require('../domain')

module.exports = (repo) => {
  return {
    async create (viewer, event) {
      return repo.save(
        domain.create(viewer, { event })
      )
    },
    async cancel (viewer, { id }) {
      const event = await repo.get(id)
      return repo.save(
        domain.cancel(viewer, { event })
      )
    },
    async find (viewer, query = {}) {
      let events = await repo.find(query.filter)
      if (query.filter) {
        events = events.filter((event) => {
          if (query.filter.locationId && query.filter.locationId !== event.locationId) return false
          if (query.filter.performerId && !event.performerIds.includes(query.filter.performerId)) return false
          return true
        })
      }
      return domain.find(viewer, { events })
    },
    async get (viewer, id) {
      assert(typeof id === 'string', `Invalid ID '${id}' passed to 'event.application'`)
      const event = await repo.get(id)
      return domain.get(viewer, { event })
    },
    async reschedule (viewer, { id, start, end, doorsOpen }) {
      const event = await repo.get(id)
      return repo.save(
        domain.reschedule(viewer, { event, start, end, doorsOpen })
      )
    },
    emitter: repo.emitter
  }
}
