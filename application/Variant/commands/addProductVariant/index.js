const assert = require('assert')

const uuid = require('uuid/v4')
const curry = require('lodash.curry')

const domain = (viewer, { product, variants, variant }) => {
  assert(product, 'Cannot attach variant to non-existent product')
  assert(!variants.find(({ name }) => name === variant.name), `Variant with name '${variant.name}' already exists`)

  return [{
    id: uuid(),
    productId: product.id,
    sku: variant.sku,
    name: variant.name,
    image: variant.image,
    metadata: variant.metadata || {},
    _type: 'ProductVariantAdded',
    _timestamp: Date.now()
  }]
}

const application = curry(async (domain, repository, viewer, { productId, ...variant }) => {
  const product = await repository.getProduct(productId)
  const variants = await repository.findProductVariants(productId)
  return repository.save(
    domain(viewer, { product, variants, variant })
  )
})

exports.domain = domain
exports.application = application
exports.addProductVariant = application(domain)
