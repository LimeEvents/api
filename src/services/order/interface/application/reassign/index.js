const assert = require('assert')

const domain = (viewer, { name, order }) => {
  assert(viewer.roles.includes('admin'), 'Unauthorized. Only administrator can modify willcall.')
  assert(name, '"name" is required to reassign willcall')
  assert(order.paid, 'Order must be paid for to reassign willcall')
  assert(!order.refunded, 'Willcall cannot be reassigned to refunded orders')

  return [
    {
      _type: 'OrderReassigned',
      _timestamp: Date.now(),
      id: order.id,
      name
    }
  ]
}

const application = ({ read, write, ...services }) => async (viewer, { id, to, from, amount }) => {
  const order = await write.get(id)
  return write.save(
    domain.reassign(viewer, { to, from, order, amount })
  )
}

const reducer = {
}

exports.application = application
exports.domain = domain
exports.reducer = reducer
