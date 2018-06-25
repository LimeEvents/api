const curry = require('lodash.curry')

const domain = (viewer, { products }) => {
  return products
}

const application = curry(async (domain, repository, viewer, input) => {
  const products = await repository.list()
  console.log('products', products)
  return domain(viewer, { products })
})

exports.domain = domain
exports.application = application
exports.listProducts = application(domain)
