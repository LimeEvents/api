const _assert = require('assert')
const uuid = require('uuid')
const curry = require('lodash.curry')

const assert = (check, message) => _assert(check, `Error enabling channel: ${message}`)

const domain = (viewer, { product, variant }) => {
  assert(viewer, 'Unauthenticated')
  assert(viewer.roles.includes('administrator'), 'Unauthorized')
  assert(product, 'Product doesn\'t exist')
  assert(variant, 'Variant must exist')

  return {
    id: uuid(),
    ...variant,
    productId: product.id
  }
}

const application = curry(async (domain, repository, viewer, { id, ...variant }) => {
  const product = await repository.getProduct(id)
  return repository.addProductVariant(
    domain(viewer, { product, variant })
  )
})

exports.domain = domain
exports.application = application
exports.addProductVariant = application(domain)
