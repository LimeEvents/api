const assert = require('assert')
const curry = require('lodash.curry')

const domain = (viewer, { channel }) => {
  assert(viewer, 'Must be signed in to remove channel')
  assert(viewer.roles.includes('administrator'), 'Unauthorized to remove channel')

  assert(channel, 'Channel does not exist')
  assert(!channel.removed, 'Channel has already been removed')
  assert(channel.disabled, 'Channel must be disabled before it can be removed')

  return {
    id: channel.id
  }
}

const application = curry(async (domain, repository, viewer, { id }) => {
  const channel = await repository.getChannel(id)
  return repository.removeChannel(
    domain(viewer, { channel })
  )
})

exports.domain = domain
exports.application = application
exports.removeChannel = application(domain)
