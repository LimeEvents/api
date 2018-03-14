const uuid = require('uuid/v4')
const assert = require('assert')
const toEvent = require('@nerdsauce/adapters/BaseEvent')

module.exports = {
  get (viewer, { order }) {
    authenticated(viewer)

    return order
  },
  find (viewer, { orders }) {
    authenticated(viewer)

    return orders
  },
  create (viewer, { inventory, eventId, tickets }) {
    const id = uuid()
    assert(inventory, 'Invalid event')
    assert(inventory.available >= tickets, 'Not enough available seats. Please try again.')
    assert(tickets > 0, 'Must reserve at least one ticket')

    return [
      toEvent('OrderCreated', {
        id,
        eventId,
        tickets
      })
    ]
  },
  reassign (viewer, { order }) {

  },
  transfer (viewer, { order }) {

  },
  charge (viewer, { order, event, name, email, source }) {
    const amount = order.tickets * event.price * 100
    const taxes = amount * 0.0675
    const fee = (order.tickets * 0.5) + (amount * 0.3)
    const total = amount + taxes
    return [
      toEvent('OrderCharged', {
        id: order.id,
        name,
        email,
        amount: total,
        taxes,
        fee,
        total
      })
    ]
  },
  refund (viewer, { order }) {

  }
}

function authenticated (viewer) {
  assert(typeof viewer === 'object', 'Viewer is malformed')
  assert(Array.isArray(viewer.roles), 'Viewer is missing roles')
}
