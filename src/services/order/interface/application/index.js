const assert = require('assert')
const domain = require('./domain')

exports.application = (repo, services) => ({
  async get (viewer, id) {
    assert(typeof id === 'string', `Invalid ID '${id}' passed to 'order.application'`)
    const order = await repo.get(id)
    return domain.get(viewer, { order })
  },
  async find (viewer, params = {}) {
    const filters = params.filter || {}
    let orders = await repo.find({ paid: true, expired: { $lt: Date.now() }, ...filters })
    if (params.filter) {
      const { locationId, performerId } = params.filter
      orders = await Promise.all(
        orders
          .map(async (order) => {
            if (performerId || locationId) {
              order.event = await services.event.get(order.eventId, '{ locationId performerIds }')
            }
            return order
          })
      )
      orders = orders
        .reduce((prev, order) => {
          if (performerId || locationId) {
            if (locationId && order.event.locationId !== locationId) {
              return prev
            }
            if (performerId && !order.event.performerIds.includes(performerId)) {
              return prev
            }
          }
          prev.push(order)
          return prev
        }, [])
    }
    return domain.find(viewer, { orders })
  },
  async getStatistics (viewer, { eventId, performerId, locationId, startDate, endDate }) {
    let orders = await this.find(viewer, { filter: { eventId, performerId, locationId } })
    return orders
      .reduce(async (prev, { eventId: orderEventId, paid, refunded, tickets, amount, fee, taxes }) => {
        const totals = await prev
        if (performerId || locationId) {
          const event = await services.event.get(orderEventId, '{ locationId performerIds }')
          if (locationId && event.locationId !== locationId) {
            return totals
          }
          if (performerId && !event.performerIds.includes(performerId)) {
            return totals
          }
        }
        if (!paid) return totals
        totals.gross += amount
        totals.taxes += taxes
        if (refunded) {
          totals.refundedAmount += amount
          totals.refunded += tickets
        }
        totals.net += amount - taxes - fee
        totals.ticketsSold += tickets
        totals.orders += 1
        totals.fees += fee
        return totals
      }, {
        gross: 0,
        net: 0,
        taxes: 0,
        refundedAmount: 0,
        refunded: 0,
        ticketsSold: 0,
        orders: 0,
        fees: 0,
        startDate,
        endDate
      })
  },
  async getWillcall (viewer, eventId) {
    const orders = await this.find(viewer, { filter: { eventId } })
    const list = orders
      .filter(({ refunded, paid, created, expired }) => {
        if (refunded) return false
        if (paid) return true
        if (expired < Date.now()) return false
        return true
      })
      .reduce((list, { id, willcall, tickets }) => {
        list[id] = {
          tickets,
          names: willcall
        }
        return list
      }, {})

    return list
  },
  async getInventory (viewer, eventId) {
    const orders = await this.find(viewer, { filter: { eventId } })
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
    const { locationId } = await services.event.get(eventId, '{ locationId }')
    const { capacity } = await services.location.get(locationId, '{ capacity }')
    return {
      sold,
      available: capacity - reserved - sold,
      capacity,
      reserved
    }
  },
  async create (viewer, { eventId, tickets }) {
    const inventory = await this.getInventory(viewer, eventId)
    return repo.save(
      domain.create(viewer, { inventory, eventId, tickets })
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
    const events = domain.charge(viewer, { order, event, id, name, email, source })

    const { amount, taxes, fee } = events.find(({ _type }) => _type === 'OrderCharged') || {}

    const chargeEvents = await services.payment.charge(viewer, { order, amount, taxes, fee, event, name, email, source })

    return repo.save(events.concat(chargeEvents))
  },
  async refund (viewer, { id, amount }) {
    const order = await repo.get(id)

    const events = domain.refund(viewer, { order, amount })
    const refundEvents = await services.payment.refund(viewer, { order, amount })

    return repo.save(events.concat(refundEvents))
  }
})
