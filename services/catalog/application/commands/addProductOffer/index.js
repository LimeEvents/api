const curry = require('lodash.curry')
const assert = require('assert')
const uuid = require('uuid/v4')

const domain = (viewer, { offer, product }) => {
  assert(viewer, 'Unauthenticated')
  assert(viewer.roles.includes('administrator'), 'Unauthorized')
  assert(product, 'Product does not exist')

  return {
    id: uuid(),
    ...offer,
    productId: product.id
  }
}

const application = curry(async (domain, repository, viewer, { id, ...offer }) => {
  const product = await repository.getProduct(id)
  return repository.addProductOffer(
    domain(viewer, { product, offer })
  )
})

exports.domain = domain
exports.application = application
exports.addProductOffer = application(domain)
