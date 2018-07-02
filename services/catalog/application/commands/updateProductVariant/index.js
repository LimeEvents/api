const _assert = require('assert')
const curry = require('lodash.curry')

const assert = (check, message) => _assert(check, `Error enabling channel: ${message}`)

const domain = (viewer, { product, variant, updates }) => {
  assert(viewer, 'Unauthenticated')
  assert(viewer.roles.includes('administrator'), 'Unauthorized')
  assert(product, 'Product doesn\'t exist')
  assert(variant, 'Variant must exist')

  return {
    ...variant,
    ...updates,
    productId: product.id
  }
}

const application = curry(async (domain, repository, viewer, { id, variantId, ...updates }) => {
  const product = await repository.getProduct(id)
  const variant = await repository.getVariant(variantId)
  return repository.updateProductVariant(
    domain(viewer, { product, variant, updates })
  )
})

exports.domain = domain
exports.application = application
exports.updateProductVariant = application(domain)
