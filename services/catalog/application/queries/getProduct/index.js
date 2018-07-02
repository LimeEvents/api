const assert = require('assert')
const curry = require('lodash.curry')

const domain = (viewer, { product }) => {
  assert(product, 'Product does not exist')
  return product
}

const application = curry(async (domain, repository, viewer, id) => {
  const product = await repository.getProduct(id)
  return domain(viewer, { product })
})

exports.domain = domain
exports.application = application
exports.getProduct = application(domain)
