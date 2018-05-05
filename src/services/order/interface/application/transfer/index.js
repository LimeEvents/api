const assert = require('assert')

const domain = (viewer, { order, inventory, eventId, tickets }) => {
  assert(order.paid, 'Cannot transfer order tickets until they have been paid for')
  assert(order.tickets >= tickets, 'Cannot transfer more tickets than available on the order')
  return this
    .create(viewer, { inventory, tickets, eventId })
    .concat([
      {
        _type: 'OrderTransferred',
        _timestamp: Date.now(),
        id: order.id,
        eventId,
        tickets: order.tickets - tickets
      }
    ])
}

const application = ({ read, write, ...services }) => async (viewer, { id, tickets, eventId }) => {
  const order = await write.get(id)
  const inventory = await this.getInventory(viewer, eventId)
  const { id: destinationOrderId } = await write.save(
    domain.transfer(viewer, { order, inventory, eventId, tickets })
  )
  return {
    destinationOrderId,
    sourceOrderId: id,
    sourceEventId: order.eventId,
    destinationEventId: eventId
  }
}

const reducer = {
  OrderTransferred (entity, event) {
    return {
      ...entity,
      tickets: event.tickets
    }
  }
}

exports.application = application
exports.domain = domain
exports.reducer = reducer
