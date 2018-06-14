const curry = require('lodash.curry')

const domain = (viewer, { variant }) => {
  return variant
}

const application = curry(async (domain, repository, viewer, id) => {
  const variant = await repository.get(id)
  return domain(viewer, { variant })
})

exports.domain = domain
exports.application = application
exports.getVariant = application(domain)
