const { application: get } = require('./get')
const domain = require('./domain')

exports.application = ({ read, write, ...services }) => ({
  get: get(read, services),
  async find (viewer, query = {}) {
    const filter = query.filter || {}
    if (filter.performerId) {
      filter.performerIds = filter.performerId
      filter.performerId = undefined
    }
    let events = await read.find(filter)
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
    return write.save(
      domain.create(viewer, { event })
    )
  },
  async cancel (viewer, { id }) {
    const event = await write.get(id)

    return write.save(
      domain.cancel(viewer, { event })
    )
  },
  async reschedule (viewer, { id, start, end, doorsOpen }) {
    const event = await write.get(id)
    return write.save(
      domain.reschedule(viewer, { event, start, end, doorsOpen })
    )
  }
})
