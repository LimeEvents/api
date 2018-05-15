const { application: get } = require('./get')
const { application: find } = require('./find')
const { application: create } = require('./create')
const { application: update } = require('./update')
const domain = require('./domain')

exports.application = ({ read, write, ...services }) => ({
  get: get(read, services),
  find: find(read, services),
  async findCurrent (viewer, query = {}) {
    return this.find(viewer, {
      ...query,
      start: { $gte: Date.now() },
      cancelled: null
    })
  },
  update: update(write, services),
  create: create(write, services),
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
