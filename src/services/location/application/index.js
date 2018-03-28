const domain = require('../domain')

module.exports = (repo) => ({
  async get (viewer, id) {
    const location = await repo.get(id)
    return domain.get(viewer, { location })
  },
  async find (viewer) {
    const locations = await repo.find()
    return domain.find(viewer, { locations })
  }
})
