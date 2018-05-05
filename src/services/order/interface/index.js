const EventEmitter = require('events')

const { link, extensions } = require('./graphql')
const { repository: read } = require('./repositories/read')
const { repository: write } = require('./repositories/write')
const { repository: event } = require('./repositories/event')
const { repository: location } = require('./repositories/location')
const { application } = require('./application')

const emitter = new EventEmitter()
exports.extensions = extensions
exports.link = link((tenantId) => application({
  read: read(tenantId, emitter),
  write: write(tenantId, emitter),
  location: location(tenantId, emitter),
  event: event(tenantId, emitter)
}))
