const EventEmitter = require('events')

const { link, extensions } = require('./graphql')
const { repository: read } = require('./repositories/read')
const { repository: write } = require('./repositories/write')
const { application } = require('./application')

exports.extensions = extensions
exports.link = (emitter = new EventEmitter()) => link((tenantId) => application({
  read: read(tenantId, emitter),
  write: write(tenantId, emitter)
}))
