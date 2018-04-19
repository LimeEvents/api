const assert = require('assert')
const debounce = require('lodash.debounce')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const { Repository } = require('@vivintsolar/repository')

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)
const safeMkdir = (dir) => mkdir(dir).catch(() => {})

exports.Repository = class FSRepository extends Repository {
  constructor ({
    name,
    reducer = (src, evt) => src,
    emitter,
    tenantId = 'default',
    directory = path.resolve(process.cwd(), 'tmp')
  }) {
    assert(process.env.NODE_ENV !== 'production', 'WARNING: FSRepository should not be used in production')
    super(emitter)
    this.name = `${name}_${tenantId}`
    this.directory = directory
    this.file = path.resolve(this.directory, `${this.name}.json`)
    this.reducer = reducer
    this.persist = debounce(async () => {
      console.info('Saving data to disk')
      const store = await this.store
      await safeMkdir(this.directory)
      await writeFile(this.file, JSON.stringify(store, null, 2))
    }, 1000)
  }

  get store () {
    try {
      if (!this._store) {
        this._store = readFile(this.file, 'utf8')
          .then((str) => JSON.parse(str))
          .catch((ex) => ({}))
      }
      return this._store
    } catch (ex) {
      this._store = Promise.resolve({})
      return this._store
    }
  }

  async find () {
    const store = await this.store
    return Object.values(store)
      .map((list) => list.reduce(this.reducer, {}))
  }

  async save (events) {
    const id = events[0].id
    const store = await this.store
    store[id] = store[id] || []
    store[id] = store[id].concat(events)
    this.persist()
    return { id }
  }

  async get (id, start, end) {
    const store = await this.store
    const list = store[id]
    if (!list) return null
    return list.reduce(this.reducer, {})
  }

  static fromRepository (repo) {
    return new FSRepository(repo.name, repo.reducer)
  }
}
