const curry = require('lodash.curry')

const domain = (viewer, { channels }) => {
  return channels
}

const application = curry(async (domain, repository, viewer, args) => {
  const channels = await repository.findChannels(args)
  return domain(viewer, { channels })
})

exports.domain = domain
exports.application = application
exports.listChannels = application(domain)
