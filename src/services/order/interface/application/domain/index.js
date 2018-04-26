const uuid = require('uuid/v4')
const assert = require('assert')
const { Event } = require('@vivintsolar/repository')

exports.get = (viewer, { order }) => {
  authenticated(viewer)
  assert(order, 'Order not found')
  return order
}
exports.find = (viewer, { orders }) => {
  authenticated(viewer)

  return orders
}

exports.getStatistics = (viewer, { orders, startDate, endDate }) => {
  return orders
    .reduce((totals, { eventId: orderEventId, paid, refunded, tickets, amount, fee, salesTax }) => {
      if (!paid) return totals
      totals.gross += amount
      totals.salesTax += salesTax
      if (refunded) {
        totals.refundedAmount += amount
        totals.refunded += tickets
      }
      totals.net += amount - salesTax - fee
      totals.ticketsSold += tickets
      totals.orders += 1
      totals.fees += fee
      return totals
    }, {
      gross: 0,
      net: 0,
      salesTax: 0,
      refundedAmount: 0,
      refunded: 0,
      ticketsSold: 0,
      orders: 0,
      fees: 0,
      startDate,
      endDate
    })
}
exports.getMetrics = (viewer, { metrics }) => {
  return metrics
}
exports.getWillcallList = (viewer, { orders }) => {
  const list = orders
    .reduce((list, { id, willcall, tickets }) => {
      list[id] = {
        tickets,
        names: willcall
      }
      return list
    }, {})

  return list
}
exports.getInventory = (viewer, { orders, capacity }) => {
  const [ sold, reserved ] = orders
    .filter(({ refunded, paid, created, expired }) => {
      if (refunded) return false
      if (paid) return true
      if (expired < Date.now()) return false
      return true
    })
    .reduce((totals, { id, tickets, paid }) => {
      if (paid) totals[0] += tickets
      else totals[1] += tickets
      return totals
    }, [0, 0])

  return {
    sold,
    available: capacity - reserved - sold,
    capacity,
    reserved
  }
}
exports.create = (viewer, { inventory, event, location, tickets }) => {
  const id = uuid()
  assert(inventory, 'Invalid event')
  assert(inventory.available >= tickets, 'Not enough available seats. Please try again.')
  assert(tickets > 0, 'Must reserve at least one ticket')

  const {
    id: eventId,
    price,
    feeDistribution,
    performerIds
  } = event

  const subtotal = tickets * price
  const salesTax = Math.ceil(subtotal * 0.0675)
  const fee = calculateFee(tickets, price)

  const locationFee = Math.ceil(fee * feeDistribution / 100)
  const customerFee = fee - locationFee

  const total = subtotal + salesTax + customerFee

  return [
    new Event('OrderCreated', {
      id,
      eventId,
      performerIds,
      locationId: location.id,
      tickets,
      price,
      subtotal,
      salesTax,
      fee: locationFee + customerFee,
      locationFee,
      customerFee,
      total
    })
  ]
}
exports.reassign = (viewer, { name, order }) => {
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
}
exports.transfer = (viewer, { order, inventory, eventId, tickets }) => {
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
}
exports.charge = (viewer, { order, event, name, email, source }) => {
  assert(!order.paid, 'Order is already paid for, don\'t charge card')
  assert(!order.refunded, 'Order has been refunded. Create a new order.')
  assert(order.expired > Date.now(), 'Order reservation has expired. Please create a new order')

  const { total, fee } = order
  return [
    new Event('OrderCharged', {
      id: order.id,
      name,
      email,
      source,
      amount: total,
      fee,
      total
    })
  ]
}
exports.refund = (viewer, { order, event, tickets }) => {
  assert(order.paid, 'Order cannot be refunded until it has been paid')
  assert(!order.refunded, 'Order has already been refunded')
  assert(order.tickets >= tickets, `Cannot refund ${tickets}. Order only has ${order.tickets}`)

  let amount = event.price * tickets
  amount += Math.ceil(amount * 0.0675)
  amount += calculateFee(tickets, event.price)

  return [
    new Event('OrderRefunded', {
      id: order.id,
      chargeId: order.chargeId,
      tickets,
      amount
    })
  ]
}
exports.cancel = (viewer, { order }) => {
  assert(order, 'Order not found')
  assert(!order.amountPaid, 'Cannot cancel an order that has been paid. Try `refundOrder`')
  assert(order.expired > Date.now(), 'Order has already expired. No need to cancel')

  return [
    new Event('OrderCancelled', {
      id: order.id
    })
  ]
}

function authenticated (viewer) {
  assert(typeof viewer === 'object', 'Viewer is malformed')
  assert(Array.isArray(viewer.roles), 'Viewer is missing roles')
}

function calculateFee (tickets, price) {
  const amount = tickets * price
  // Fee: 3% + $0.50/ticket
  return Math.ceil((tickets * 0.5) + (amount * 0.03))
}
