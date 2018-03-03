const Repository = require('./Repository')

module.exports = class MemoryRepository extends Repository {
  constructor (name, reducer = (src, evt) => src) {
    super()
    this.name = name
    this.reducer = reducer
    this.store = {}
  }

  async save (events) {
    const id = events[0].id
    this.store[id] = this.store[id] || []
    this.store[id] = this.store[id].concat(events)
    return { id }
  }

  async get (id, start, end) {
    const list = this.store[id] || []
    return list.reduce(this.reducer)
  }

  static fromRepository (repo) {
    return new MemoryRepository(repo.name, repo.reducer)
  }
}
