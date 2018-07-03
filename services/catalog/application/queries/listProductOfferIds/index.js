const curry = require('lodash.curry')

const domain = (viewer, { product, list, cursor }) => {
  return {
    list,
    cursor
  }
}

const application = curry(async (domain, repository, viewer, { id, cursor, limit }) => {
  const product = await repository.getProduct(id)
  const results = await repository.listProductOfferIds({ id, cursor, limit })
  return domain(viewer, { product, ...results })
})

exports.domain = domain
exports.application = application
exports.listProductOfferIds = application(domain)
