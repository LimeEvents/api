const assert = require('assert')

const domain = (viewer, { order }) => {
  authenticated(viewer)
  assert(order, 'Order not found')
  return order
}

const application = (repo, services) => async (viewer, id) => {
  assert(typeof id === 'string', `Invalid ID '${id}' passed to 'order.application'`)
  const order = await repo.get(id)
  return domain(viewer, { order })
}

exports.domain = domain
exports.application = application

function authenticated (viewer) {
  assert(typeof viewer === 'object', 'Viewer is malformed')
  assert(Array.isArray(viewer.roles), 'Viewer is missing roles')
}
