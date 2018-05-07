const { domain: get } = require('../get')

const domain = (viewer, { events = [] }) => {
  return events
    .map(event => get(viewer, { event }))
    .filter(Boolean)
}

const application = (repo, services) => async (viewer, query = {}) => {
  const filter = query.filter || {}
  let events = []
  if (filter.performerId) {
    events = await repo.findByPerformerId(filter.performerId)
  } else if (filter.externalId) {
    events = await repo.findByExternalId(filter.externalId)
  } else {
    events = await repo.find(filter)
  }
  return domain(viewer, { events })
}

exports.application = application
exports.domain = domain
