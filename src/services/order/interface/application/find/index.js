const assert = require('assert')

const domain = (viewer, { orders }) => {
  authenticated(viewer)

  return orders
}

const application = (repo, services) => async (viewer, params = {}) => {
  const filter = params.filter || {}
  let orders = await repo.find(filter)
  return domain(viewer, { orders })
}

exports.application = application
exports.domain = domain

function authenticated (viewer) {
  assert(typeof viewer === 'object', 'Viewer is malformed')
  assert(Array.isArray(viewer.roles), 'Viewer is missing roles')
}
