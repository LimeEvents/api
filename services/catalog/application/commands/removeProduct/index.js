const assert = require('assert')
const curry = require('lodash.curry')

const domain = (viewer, { id, ...product }) => {
  assert(viewer, 'Must be signed in to remove products')
  assert(viewer.roles.includes('administrator'), 'Unauthorized')
  assert(product, 'Product does not exist')

  return { id }
}

const application = curry(async (domain, repository, viewer, id) => {
  const product = await repository.getProduct(id)
  domain(viewer, product)
  return repository.removeProduct(id)
})

exports.domain = domain
exports.application = application
exports.removeProduct = application(domain)
