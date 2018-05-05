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

const FIFTEEN_MINUTES = 1000 * 60 * 15

const reducer = {
  OrderCreated (entity, event) {
    return {
      ...entity,
      id: event.id,
      eventId: event.eventId,
      locationId: event.locationId,
      performerIds: event.performerIds,

      tickets: event.tickets,

      expired: FIFTEEN_MINUTES + event._timestamp,

      customerFee: event.customerFee,
      locationFee: event.locationFee,
      fee: event.fee,
      salesTax: event.salesTax,
      subtotal: event.subtotal,
      total: event.total,
      created: event._timestamp
    }
  }
}

exports.domain = domain
exports.application = application
exports.reducer = reducer

function authenticated (viewer) {
  assert(typeof viewer === 'object', 'Viewer is malformed')
  assert(Array.isArray(viewer.roles), 'Viewer is missing roles')
}
