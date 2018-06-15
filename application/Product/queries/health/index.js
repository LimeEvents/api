const curry = require('lodash.curry')

const domain = (viewer, { dynamo, mongo }) => {
  return { dynamo, mongo }
}

const application = curry(async (domain, repository, viewer, input) => {
  const results = await repository.health(input)
  return domain(viewer, results)
})

exports.domain = domain
exports.application = application
exports.health = application(domain)
