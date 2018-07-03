const assert = require('assert')
const uuid = require('uuid/v4')
const curry = require('lodash.curry')

const domain = (viewer, { product, parent }) => {
  const id = uuid()
  assert(!product.parentId || parent, 'Parent product does not exist')
  return {
    id,
    name: product.name,
    url: `https://www.vivintsolar.com/products/${id}`,
    caption: product.caption,
    description: product.description,
    seo: product.seo || {
      title: product.name,
      description: product.caption || product.description
    },
    parentId: product.parentId,
    sections: product.sections || [],
    tags: product.tags || [],
    dimensions: product.dimensions,
    metadata: product.metadata || {},
    created: Date.now(),
    updated: Date.now()
  }
}

const application = curry(async (domain, repository, viewer, product) => {
  const payload = { product }
  if (product.parentId) payload.parent = await repository.getProduct(product.parentId)
  return repository.addProduct(
    domain(viewer, payload)
  )
})

exports.domain = domain
exports.application = application
exports.addProduct = application(domain)
