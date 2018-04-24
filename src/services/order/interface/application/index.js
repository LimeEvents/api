const assert = require('assert')
const domain = require('./domain')

exports.application = (repo, services) => ({
  async get (viewer, id) {
    assert(typeof id === 'string', `Invalid ID '${id}' passed to 'order.application'`)
    const order = await repo.get(id)
    return domain.get(viewer, { order })
  },
  async find (viewer, params = {}) {
    const filter = params.filter || {}
    let orders = await repo.find(filter)
    return domain.find(viewer, { orders })
  },
  async getStatistics (viewer, { eventId, performerId, locationId, startDate, endDate }) {
    let orders = await this.find(viewer, { eventId, performerId, locationId })

    return domain.getStatistics(viewer, { orders, startDate, endDate })
  },
  async getWillcall (viewer, eventId) {
    const orders = await this.find(viewer, { paid: true })
    return domain.getWillcallList(viewer, { orders })
  },
  async getInventory (viewer, eventId) {
    const orders = await this.find(viewer, { eventId, refunded: false })
    const { locationId } = await services.event.get(eventId, '{ locationId }')
    const { capacity } = await services.location.get(locationId, '{ capacity }')
    return domain.getInventory(viewer, { orders, capacity })
  },
  async create (viewer, { eventId, tickets }) {
    const inventory = await this.getInventory(viewer, eventId)
    const event = await services.event.get(eventId, '{ price locationId id feeDistribution performerIds }')
    const location = await services.location.get(event.locationId, '{ id address { postalCode } }')
    return repo.save(
      domain.create(viewer, { inventory, eventId, tickets, event, location })
    )
  },
  async reassign (viewer, { id, to, from, amount }) {
    const order = await repo.get(id)
    return repo.save(
      domain.reassign(viewer, { to, from, order, amount })
    )
  },
  async transfer (viewer, { id, tickets, eventId }) {
    const order = await repo.get(id)
    const inventory = await this.getInventory(viewer, eventId)
    const { id: destinationOrderId } = await repo.save(
      domain.transfer(viewer, { order, inventory, eventId, tickets })
    )
    return {
      destinationOrderId,
      sourceOrderId: id,
      sourceEventId: order.eventId,
      destinationEventId: eventId
    }
  },
  async charge (viewer, { id, name, email, source }) {
    const order = await repo.get(id)
    const event = await services.event.get(order.eventId, '{ price }')

    return repo.save(
      domain.charge(viewer, { order, event, id, name, email, source })
    )
  },
  async refund (viewer, { id, tickets }) {
    const order = await repo.get(id)
    const event = await services.event.get(order.eventId, '{ price }')
    return repo.save(
      domain.refund(viewer, { order, tickets, event })
    )
  }
})
