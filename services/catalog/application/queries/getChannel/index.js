const assert = require('assert')
const curry = require('lodash.curry')

const domain = (viewer, { channel }) => {
  assert(channel, 'Channel does not exist')
  return channel
}

const application = curry(async (domain, repository, viewer, id) => {
  const channel = await repository.getChannel(id)
  return domain(viewer, { channel })
})

exports.domain = domain
exports.application = application
exports.getChannel = application(domain)
