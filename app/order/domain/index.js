const uuid = require('uuid/v4')
const assert = require('assert')

module.exports = {
  get (viewer, { order }) {

  },
  create (viewer, { inventory, eventId, tickets }) {
    const id = uuid()
    assert(inventory, 'Invalid event')
    assert(inventory.available >= tickets, 'Not enough available seats. Please try again.')
    assert(tickets > 0, 'Must reserve at least one ticket')

    return [{
      id,
      eventId,
      tickets,
      meta: {
        id,
        type: 'OrderCreated',
        timestamp: Date.now()
      }
    }]
  },
  reassign (viewer, { order }) {

  },
  transfer (viewer, { order }) {

  },
  purchase (viewer, { order, customer, inventory }) {
    return [{
      id: order.id,
      email: customer.email,
      meta: {
        id: order.id,
        type: 'OrderCharged',
        timestamp: Date.now()
      }
    }]
  },
  refund (viewer, { order }) {

  }
}

function authenticated (viewer) {
  assert(typeof viewer === 'object', 'Viewer is malformed')
  assert(Array.isArray(viewer.roles), 'Viewer is missing roles')
}
