const _assert = require('assert')
const curry = require('lodash.curry')

const assert = (check, message) => _assert(check, `Error enabling channel: ${message}`)

const domain = (viewer, { product, variant }) => {
  assert(viewer, 'Unauthenticated')
  assert(viewer.roles.includes('administrator'), 'Unauthorized')
  assert(product, 'Product doesn\'t exist')
  assert(variant, 'Variant must exist')

  return {
    variantId: variant.id,
    productId: product.id
  }
}

const application = curry(async (domain, repository, viewer, { id, variantId }) => {
  const product = await repository.getProduct(id)
  const variant = await repository.getVariant(variantId)
  return repository.removeProductVariant(
    domain(viewer, { product, variant })
  )
})

exports.domain = domain
exports.application = application
exports.removeProductVariant = application(domain)
