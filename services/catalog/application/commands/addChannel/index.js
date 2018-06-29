const uuid = require('uuid/v4')
const assert = require('assert')
const curry = require('lodash.curry')

const domain = (viewer, { channel }) => {
  assert(viewer, 'Unauthenticated')
  assert(viewer.roles.includes('administrator'), 'Unauthorized')
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
    domain(viewer, input)
  )
})

exports.domain = domain
exports.application = application
exports.addChannel = application(domain)
