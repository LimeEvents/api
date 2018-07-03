const assert = require('assert')
const curry = require('lodash.curry')

const domain = (viewer, { offer }) => {
  assert(offer, 'Offer does not exist')
  return offer
}

const application = curry(async (domain, repository, viewer, id) => {
  const offer = await repository.getProductOffer(id)
  return domain(viewer, { offer })
})

exports.domain = domain
exports.application = application
exports.getProductOffer = application(domain)
