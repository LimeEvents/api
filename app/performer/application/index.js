const domain = require('../domain')

module.exports = (repo) => ({
  async get (viewer, id) {
    const performer = await repo.get(id)
    return domain.get(viewer, { performer })
  },
  async find (viewer, query) {
    const performers = await repo.find(query)
    return domain.find(viewer, { performers })
  },
  async register (viewer, performer) {
    return repo.save(
      domain.register(viewer, { performer })
    )
  },
  async update (viewer, update) {
    const performer = await repo.get(update.id)
    return repo.save(
      domain.update(viewer, { performer, update })
    )
  },
  async remove (viewer, id) {
    const performer = await repo.get(id)
    return repo.save(
      domain.remove(viewer, { performer })
    )
  },
  emitter: repo.emitter
})
