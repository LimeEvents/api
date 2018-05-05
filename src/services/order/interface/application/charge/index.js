const assert = require('assert')

const domain = (viewer, { order, event, name, email, source }) => {
  assert(!order.paid, 'Order is already paid for, don\'t charge card')
  assert(!order.refunded, 'Order has been refunded. Create a new order.')
  assert(order.expired > Date.now(), 'Order reservation has expired. Please create a new order')

  const { total, fee } = order
  return [
    {
      id: order.id,
      _type: 'OrderCharged',
      _timestamp: Date.now(),
      name,
      email,
      source,
      amount: total,
      fee,
      total
    }
  ]
}

const application = (repo, services) => async (viewer, { id, name, email, source }) => {
  const order = await repo.get(id)
  const event = await services.event.get(viewer, order.eventId, '{ price }')

  return repo.save(
    domain(viewer, { order, event, id, name, email, source })
  )
}

exports.application = application
exports.domain = domain
