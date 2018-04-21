const domain = require('./domain')

exports.application = (repo, services) => ({
  async get (viewer, id) {
    const customer = await repo.get(id)
    return domain.get(viewer, { customer })
  },
  async find (viewer, params) {
    const customers = repo.find(params)
    return domain.find(viewer, { customers })
  },
  async create (viewer, { contact, address }) {
    return repo.save(
      domain.create(viewer, { contact, address })
    )
  }
})
