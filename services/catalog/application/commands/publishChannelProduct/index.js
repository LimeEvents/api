const _assert = require('assert')
const curry = require('lodash.curry')

const assert = (check, message) => _assert(check, `Error publishing product to channel: ${message}`)

const domain = (viewer, { channel, product }) => {
  assert(viewer, 'Unauthenticated')
  assert(channel, 'Channel does not exist')
  assert(product, 'Product does not exist')
  assert(!channel.productIds.includes(product.id), 'Product already publish to this channel')
  return {
    id: channel.id,
    productId: product.id
  }
}

const application = curry(async (domain, repository, viewer, { id, productId }) => {
  const channel = await repository.getChannel(id)
  const product = await repository.getProduct(productId)
  return repository.publishChannelProduct(
    domain(viewer, { channel, product })
  )
})

exports.domain = domain
exports.application = application
exports.publishChannelProduct = application(domain)
