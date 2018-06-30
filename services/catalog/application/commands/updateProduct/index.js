const assert = require('assert')
const curry = require('lodash.curry')

const domain = (viewer, { product, updates }) => {
  assert(viewer, 'Must be signed in to update products')
  assert(viewer.roles.includes('administrator'), 'Unauthorized')

  return {
    url: `https://www.vivintsolar.com/products/${product.id}`,
    ...product,
    ...updates,
    seo: {
      ...product.seo,
      ...updates.seo
    },
    updated: Date.now()
  }
}

const application = curry(async (domain, repository, viewer, { id, ...updates }) => {
  const product = await repository.get(id)
  return repository.update(
    domain(viewer, { product, updates })
  )
})

exports.domain = domain
exports.application = application
exports.updateProduct = application(domain)
