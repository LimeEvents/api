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
    async find (viewer, query) {
      const events = await repo.find(query)
      return domain.find(viewer, { events })
    },
    async get (viewer, id) {
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
