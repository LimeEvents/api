const uuid = require('uuid/v4')
const curry = require('lodash.curry')

const domain = (viewer, { product }) => {
  const id = uuid()
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
    sections: product.sections || [],
    tags: product.tags || [],
    dimensions: product.dimensions,
    metadata: product.metadata || {},
    created: Date.now(),
    updated: Date.now()
  }
}

const application = curry(async (domain, repository, viewer, product) => {
  return repository.add(
    domain(viewer, { product })
  )
})

exports.domain = domain
exports.application = application
exports.addProduct = application(domain)
