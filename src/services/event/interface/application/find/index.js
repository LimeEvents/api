const { domain: get } = require('../get')

const domain = (viewer, { events = [] }) => {
  return events
    .map(event => get(viewer, { event }))
    .filter(Boolean)
}

const application = (repo, services) => async (viewer, query = {}) => {
  const filter = query.filter || {}
  if (filter.performerId) {
    filter.performerIds = filter.performerId
    filter.performerId = undefined
  }
  let events = await repo.find(filter)
  return domain(viewer, { events })
}

exports.application = application
exports.domain = domain
