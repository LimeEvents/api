const domain = require('./domain')

exports.application = (repo) => ({
  async get (viewer, id) {
    const event = await repo.get(id)
    return domain.get(viewer, { event })
  },
  async find (viewer, query = {}) {
    const filter = query.filter || {}
    if (filter.performerId) {
      filter.performerIds = filter.performerId
      filter.performerId = undefined
    }
    let events = await repo.find(filter)
    return domain.find(viewer, { events })
  },
  async findCurrent (viewer, query = {}) {
    return this.find(viewer, {
      ...query,
      start: { $gte: Date.now() },
      cancelled: null
    })
  },
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
  async reschedule (viewer, { id, start, end, doorsOpen }) {
    const event = await repo.get(id)
    return repo.save(
      domain.reschedule(viewer, { event, start, end, doorsOpen })
    )
  }
})
