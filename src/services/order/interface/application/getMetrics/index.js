const assert = require('assert')

const domain = (viewer, { metrics }) => {
  return metrics
}

const application = (repo, services) => async (viewer, args) => {
  const { aggregate, count, value } = args.filter
  let metrics = null
  assert(aggregate || count, 'Must include either "aggregate" or "count" field')
  if (aggregate) {
    metrics = repo.aggregate(aggregate, args)
  } else if (count) {
    assert(value, 'Order metric count queries require a "value" field')
    metrics = repo.count(count, value, args)
  }
  return domain(viewer, { metrics })
}

exports.domain = domain
exports.application = application
