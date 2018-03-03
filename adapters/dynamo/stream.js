const { Readable, Writable } = require('stream')

const _query = Symbol('_query')

exports.Readable = class DynamoReadStream extends Readable {
  constructor (db, query, options = {}) {
    super(Object.assign({ objectMode: true }, options))
    this.db = db
    this.query = query
  }

  async [_query] () {
    if (this.reading === true) return
    this.reading = true
    const { Items, LastEvaluatedKey } = await this
      .db
      .query(Object.assign({}, this.query, { ExclusiveStartKey: this.cursor }))
      .promise()
    this.cursor = LastEvaluatedKey
    if (!this.cursor) {
      this.end = true
    }
    Items.forEach((item) => {
      if (!this.push(item)) {
        this.reading = false
      }
    })
    if (!this.cursor) {
      return this.push(null)
    }
  }

  async _read (size) {
    try {
      const results = await this[_query]()
      return results
    } catch (err) {
      this.emit('error', err)
    }
  }
}

exports.Writable = class DynamoWriteStream extends Writable {
  constructor (db, table, options = {}) {
    super(Object.assign({ objectMode: true }, options))
    this.db = db
    this.table = table
  }

  _write (chunk, encoding, callback) {
    return this.db.put({
      TableName: this.table,
      Item: chunk
    }, callback)
  }

  _writev (chunks, callback) {
    return this.db.batchWrite({
      RequestItems: {
        [this.name]: chunks.map((Item) => ({ PutRequest: { Item } }))
      }
    }, callback)
  }
}
