const curry = require('lodash.curry')

const domain = (viewer, { product, variants }) => {
  return variants
}

const application = curry(async (domain, repository, viewer, { id, cursor, limit }) => {
  const product = await repository.getProduct(id)
  const variants = await repository.listProductVariantIds({ id, cursor, limit })
  return domain(viewer, { product, variants })
})

exports.domain = domain
exports.application = application
exports.listProductVariantIds = application(domain)
