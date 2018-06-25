const uuid = require('uuid/v4')
const curry = require('lodash.curry')

const domain = (viewer, { product }) => {
  return {
    id: uuid(),
    name: product.name,
    caption: product.caption,
    description: product.description,
    seo: product.seo || {
      title: product.name,
      description: product.caption || product.description
    },
    sections: product.sections || [],
    tags: product.tags,
    dimensions: product.dimensions,
    metadata: product.metadata || {}
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
