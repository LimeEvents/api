const assert = require('assert')

const domain = (viewer, { order, event, tickets }) => {
  assert(order.paid, 'Order cannot be refunded until it has been paid')
  assert(!order.refunded, 'Order has already been refunded')
  assert(order.tickets >= tickets, `Cannot refund ${tickets}. Order only has ${order.tickets}`)

  let amount = event.price * tickets
  amount += Math.ceil(amount * 0.0675)
  amount += calculateFee(tickets, event.price)

  return [
    {
      _type: 'OrderRefunded',
      _timestamp: Date.now(),
      id: order.id,
      chargeId: order.chargeId,
      tickets,
      amount
    }
  ]
}

const application = ({ read, write, ...services }) => async (viewer, { id, tickets }) => {
  const order = await write.get(id)
  const event = await services.event.get(order.eventId, '{ price }')
  return write.save(
    domain.refund(viewer, { order, tickets, event })
  )
}

exports.application = application
exports.domain = domain

function calculateFee (tickets, price) {
  const amount = tickets * price
  // Fee: 3% + $0.50/ticket
  return Math.ceil((tickets * 0.5) + (amount * 0.03))
}
