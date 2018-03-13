
const { Readable, Writable } = require('stream')

const RESTRICTED_KEYS = ['start', 'end']

exports.Readable = class SourceWrapper extends Readable {
  constructor (db, query, options) {
    super(Object.assign({ objectMode: true }, options))
    this.db = db
    this.query = this.formatQuery(query)
    this._cursor = null
  }

  formatQuery (query) {
    const base = { 'meta.timestamp': { $gte: query.start, $lte: query.end } }
    return Object.entries(query)
      .reduce((prev, [ key, value ]) => {
        if (Array.isArray(value)) value = { $in: value }
        if (!RESTRICTED_KEYS.includes(key)) prev[key] = value
        return prev
      }, base)
  }

  _start () {
    this._source = this.db.find(this.query)

    // Every time there's data, push it into the internal buffer.
    this._source.each((chunk, cursor) => {
      this._cursor = cursor
      // if push() returns false, then stop reading from source
      if (!this.push(chunk)) cursor.pause()
    })

    // When the source ends, push the EOF-signaling `null` chunk
    this._source.then(() => {
      this._cursor = null
      this.push(null)
    })
  }
  // _read will be called when the stream wants to pull more data in
  // the advisory size argument is ignored in this case.
  _read (size) {
    if (this._cursor) {
      return this._cursor.resume()
    }
    this._start()
  }
}

exports.Writable = class MongoWriteStream extends Writable {
  constructor (db, options = {}) {
    super(Object.assign({ objectMode: true }, options))
    this.db = db
  }

  _write (chunk, encoding, callback) {
    chunk._id = chunk.meta.id
    return this.db.insert(chunk)
      .then(results => callback(null, results))
      .catch(callback)
  }

  _writev (chunks, callback) {
    return this.db.insert(chunks)
      .then(results => callback(null, results))
      .catch(callback)
  }
}
