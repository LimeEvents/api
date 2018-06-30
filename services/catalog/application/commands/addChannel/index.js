const uuid = require('uuid/v4')
const assert = require('assert')
const curry = require('lodash.curry')

const domain = (viewer, { channel }) => {
  assert(viewer, 'Must be signed in to enable channels')
  assert(viewer.roles.includes('administrator'), 'Unauthorized')
  assert(typeof channel === 'object', 'Invalid input')
  const now = Date.now()
  return {
    id: uuid(),
    ...channel,
    created: now,
    updated: now
  }
}

const application = curry(async (domain, repository, viewer, input) => {
  return repository.addChannel(
    domain(viewer, { channel: input })
  )
})

exports.domain = domain
exports.application = application
exports.addChannel = application(domain)
