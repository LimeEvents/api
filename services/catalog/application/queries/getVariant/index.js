const assert = require('assert')
const curry = require('lodash.curry')

const domain = (viewer, { variant }) => {
  assert(variant, 'Variant does not exist')
  return variant
}

const application = curry(async (domain, repository, viewer, id) => {
  const variant = await repository.getVariant(id)
  return domain(viewer, { variant })
})

exports.domain = domain
exports.application = application
exports.getVariant = application(domain)
