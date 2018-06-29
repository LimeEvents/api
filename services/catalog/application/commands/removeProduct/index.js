const assert = require('assert')
const curry = require('lodash.curry')

const domain = (viewer, { id, ...product }) => {
  assert(viewer, 'Unauthenticated')
  assert(viewer.roles.includes('administrator'), 'Unauthorized')
  assert(product, 'Product does not exist')

  return { id }
}

const application = curry(async (domain, repository, viewer, id) => {
  const product = await repository.get(id)
  domain(viewer, product)
  return repository.remove(id)
})

exports.domain = domain
exports.application = application
exports.removeProduct = application(domain)
