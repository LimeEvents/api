const assert = require('assert')
const { Repository } = require('@vivintsolar/repository')

exports.Repository = class MemoryRepository extends Repository {
  constructor ({
    name,
    reducer = (src, evt) => src,
    emitter,
    tenantId = 'default'
  }) {
    assert(process.env.NODE_ENV !== 'production', 'WARNING: InMemoryRepository should not be used in production')
    super(emitter)
    this.name = `${name}_${tenantId}`
    this.reducer = reducer
    this.store = {}
  }

  async find () {
    return Object.values(this.store)
      .map((list) => list.reduce(this.reducer, {}))
  }

  async save (events) {
    const id = events[0].id
    this.store[id] = this.store[id] || []
    this.store[id] = this.store[id].concat(events)
    return { id }
  }

  async get (id, start, end) {
    const list = this.store[id]
    if (!list) return null
    return list.reduce(this.reducer, {})
  }

  static fromRepository (repo) {
    return new MemoryRepository(repo.name, repo.reducer)
  }
}
