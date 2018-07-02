const curry = require('lodash.curry')

const domain = (viewer, { products }) => {
  return products
}

const application = curry(async (domain, repository, viewer, args) => {
  const products = await repository.findProducts(args)
  return domain(viewer, { products })
})

exports.domain = domain
exports.application = application
exports.listProducts = application(domain)
