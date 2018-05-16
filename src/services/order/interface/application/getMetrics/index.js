const assert = require('assert')

const domain = (viewer, { metrics }) => {
  return metrics
}

const application = (repo, services) => async (viewer, args) => {
  const { aggregate } = args.filter
  assert(aggregate, 'Must include either "aggregate" field')
  const metrics = await repo.aggregate(aggregate, args)
  return domain(viewer, { metrics })
}

exports.domain = domain
exports.application = application
