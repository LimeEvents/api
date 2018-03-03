const assert = require('assert')
const { Transform } = require('stream')
const toArray = require('stream-to-array')
const AWS = require('aws-sdk')
const onEnd = require('end-of-stream')
const Repository = require('./Repository')

const _map = Symbol('_map')
const _reduction = Symbol('_reduction')

const db = new AWS.DynamoDB({
  apiVersion: '2012-08-10',
  region: 'us-west-2',
  endpoint: process.env.DYNAMO_ENDPOINT,
  params: {
    TableName: this.name
  }
})
db
  .listTables()
  .promise()
  .then(({ TableNames }) => {
    return db.describeTable({
      TableName: TableNames[0]
    }).promise()
  })

module.exports = class ESRepository extends Repository {
  constructor (name, reducer = (src, evt) => src) {
    super()
    this.name = name
    this.reducer = reducer
    assert(typeof this.read === 'function', 'Class extending ESRespository must implement `read`')
    assert(typeof this.write === 'function', 'Class extending ESRespository must implement `write`')
  }

  async save (events) {
    const stream = this.write()
    events.map(event => stream.write(event))
    stream.end()
    return new Promise((resolve, reject) => onEnd(stream, (err) => {
      if (err) return reject(err)
      return resolve({ id: events[0].id })
    }))
  }

  async list () {
    const list = await toArray(
      this.read()
        .pipe(new Transform({
          objectMode: true,
          transform (chunk, encoding, callback) {
            if (!this[_map]) this[_map] = {}
            const obj = Object.assign({}, this[_map][chunk.id] || {})
            this[_map][chunk.id] = this.reducer(obj, chunk)
            callback()
          },
          flush (callback) {
            Object.values(this[_map])
              .map(value => this.push(value))
            this[_map] = {}
            callback()
          }
        }))
    )
    return list
  }

  async get (id, start, end) {
    const [ object ] = await toArray(
      this
        .read(id, start, end)
        .pipe(reduce(this.reducer))
    )
    return object
  }
}

function reduce (fn, init) {
  return new Transform({
    objectMode: true,
    transform (chunk, encoding, callback) {
      this[_reduction] = fn(this[_reduction] || init, chunk)
      callback()
    },
    flush (callback) {
      this.push(this[_reduction])
      this[_reduction] = {}
      callback()
    }
  })
}
