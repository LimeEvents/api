const assert = require('assert')
const domain = require('./domain')

exports.application = (repo) => ({
  async get (viewer, id) {
    assert(typeof id === 'string', `Invalid ID '${id}' passed to 'performer.application'`)
    const performer = await repo.get(id)
    return domain.get(viewer, { performer })
  },
  async find (viewer, query = {}) {
    let performers = await repo.find(query.filter)
    return domain.find(viewer, { performers })
  },
  async register (viewer, performer) {
    return repo.save(
      domain.register(viewer, { performer })
    )
  },
  async update (viewer, updates) {
    const performer = await repo.get(updates.id)
    return repo.save(
      domain.update(viewer, { performer, updates })
    )
  },
  async remove (viewer, id) {
    const performer = await repo.get(id)
    return repo.save(
      domain.remove(viewer, { performer })
    )
  }
})
