// const assert = require('assert')
const curry = require('lodash.curry')

const domain = (viewer, { channel, products }) => {
  return products
}

const application = curry(async (domain, repository, viewer, { id }) => {
  const channel = await repository.getChannel(id)
  const products = await repository.listChannelProducts({ id })
  return domain(viewer, { channel, products })
})

exports.domain = domain
exports.application = application
exports.listChannelProducts = application(domain)
