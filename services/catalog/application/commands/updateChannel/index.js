const _assert = require('assert')
const curry = require('lodash.curry')

const assert = (check, message) => _assert(check, `Error updating channel: ${message}`)

const domain = (viewer, { channel, updates }) => {
  assert(viewer, 'Unauthenticated')
  assert(viewer.roles.includes('administrator'))
  assert(channel, 'Channel does not exist')
  assert(!channel.removed, 'Channel has been removed')

  return {
    id: channel.id,
    ...channel,
    ...updates
  }
}

const application = curry(async (domain, repository, viewer, { id, ...updates }) => {
  const channel = await repository.getChannel(id)
  return repository.updateChannel(
    domain(viewer, { channel, updates })
  )
})

exports.domain = domain
exports.application = application
exports.updateChannel = application(domain)
