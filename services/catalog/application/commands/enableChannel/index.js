const _assert = require('assert')
const curry = require('lodash.curry')

const assert = (check, message) => _assert(check, `Error enabling channel: ${message}`)

const domain = (viewer, { channel }) => {
  console.log(viewer)
  assert(viewer, 'Must be signed in to enable channels')
  assert(viewer.roles.includes('administrator'))
  const now = Date.now()
  assert(channel, 'Channel does not exist')
  assert(!channel.removed, 'Channel has been removed')
  assert(!channel.enabled, 'Channel is already enabled')
  return {
    id: channel.id,
    enabled: now,
    disabled: null
  }
}

const application = curry(async (domain, repository, viewer, { id }) => {
  const channel = await repository.getChannel(id)
  return repository.enableChannel(
    domain(viewer, { channel })
  )
})

exports.domain = domain
exports.application = application
exports.enableChannel = application(domain)
