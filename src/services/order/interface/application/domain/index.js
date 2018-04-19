const uuid = require('uuid/v4')
const assert = require('assert')
const { Event } = require('@vivintsolar/repository')

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
      new Event('OrderCreated', {
        id,
        eventId,
        tickets
      })
    ]
  },
  reassign (viewer, { name, order }) {
    assert(viewer.roles.includes('admin'), 'Unauthorized. Only administrator can modify willcall.')
    assert(name, '"name" is required to reassign willcall')
    assert(order.paid, 'Order must be paid for to reassign willcall')
    assert(!order.refunded, 'Willcall cannot be reassigned to refunded orders')

    return [
      new Event('OrderReassigned', {
        id: order.id,
        name
      })
    ]
  },
  transfer (viewer, { order, inventory, eventId, tickets }) {
    assert(order.paid, 'Cannot transfer order tickets until they have been paid for')
    assert(order.tickets >= tickets, 'Cannot transfer more tickets than available on the order')
    return this
      .create(viewer, { inventory, tickets, eventId })
      .concat([
        new Event('OrderTransferred', {
          id: order.id,
          eventId,
          tickets: order.tickets - tickets
        })
      ])
  },
  charge (viewer, { order, event, name, email, source }) {
    assert(!order.paid, 'Order is already paid for, don\'t charge card')
    assert(!order.refunded, 'Order has been refunded. Create a new order.')
    assert(order.expired > Date.now(), 'Order reservation has expired. Please create a new order')

    const amount = order.tickets * event.price
    const taxes = Math.ceil(amount * 0.0675)
    // Fee: 3% + $0.50/ticket
    const fee = Math.ceil((order.tickets * 0.5) + (amount * 0.03))
    const total = amount + taxes
    return [
      new Event('OrderCharged', {
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
    assert(order.paid, 'Order cannot be refunded until it has been paid')
    assert(!order.refunded, 'Order has already been refunded')

    return [
      new Event('OrderRefunded', {
        id: order.id
      })
    ]
  }
}

function authenticated (viewer) {
  assert(typeof viewer === 'object', 'Viewer is malformed')
  assert(Array.isArray(viewer.roles), 'Viewer is missing roles')
}
