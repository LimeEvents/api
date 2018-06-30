const assert = require('assert')
const curry = require('lodash.curry')

const domain = (viewer, { channel, start = Date.now() }) => {
  assert(viewer, 'Must be signed in to disable channels')
  assert(viewer.roles.includes('administrator'))
  assert(channel, 'Channel does not exist')
  assert(!channel.removed, 'Channel has been removed')
  assert(!channel.disabled, 'Channel is already disabled')
  return {
    id: channel.id,
    enabled: null,
    disabled: start
  }
}

const application = curry(async (domain, repository, viewer, { id, start }) => {
  const channel = await repository.getChannel(id)
  return repository.disableChannel(
    domain(viewer, { channel, start })
  )
})

exports.domain = domain
exports.application = application
exports.disableChannel = application(domain)
