const assert = require('assert')
const domain = require('../domain')

module.exports = (repo, services) => {
  // repo.emitter
  //   .on('EventCreated', ({ locationId }) => {
  //     // Create ticket inventory
  //   })
  //   .on('EventCancelled', ({ locationId }) => {

  //   })
  //   .on('EventExpired', () => {

  //   })
  return {
    async get (viewer, id) {
      assert(typeof id === 'string', `Invalid ID '${id}' passed to 'order.application'`)
      const order = await repo.get(id)
      return domain.get(viewer, { order })
    },
    async find (viewer, params = {}) {
      let orders = await repo.find()
      if (params.filter) {
        orders = orders.filter((order) => {
          if (params.filter.eventId && params.filter.eventId !== order.eventId) return false
          if (!order.paid && order.expired < Date.now()) return false
          if (order.refunded) return false
          return true
        })
      }
      return domain.find(viewer, { orders })
    },
    async getStatistics (viewer, { eventId, performerId, locationId, startDate, endDate }) {
      let orders = await this.find(viewer, { filter: { eventId, performerId, locationId } })
      return orders
        .reduce(async (prev, { eventId: orderEventId, paid, refunded, tickets, amount, fee, taxes }) => {
          const totals = await prev
          if (performerId || locationId) {
            const event = await services.event.get(viewer, orderEventId)
            if (locationId && event.locationId !== locationId) {
              return totals
            }
            if (performerId && !event.performerIds.includes(performerId)) {
              return totals
            }
          }
          if (!paid) return totals
          totals.revenue += amount
          totals.taxes = taxes
          if (refunded) {
            totals.refundedAmount += amount
            totals.refunded += tickets
          }
          totals.ticketsSold += tickets
          totals.orders += 1
          totals.fees += fee
          return totals
        }, {
          revenue: 0,
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
      const { locationId } = await services.event.get(viewer, eventId)
      const { capacity } = await services.location.get(viewer, locationId)
      return {
        sold,
        available: capacity - reserved - sold,
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
      const event = await services.event.get(viewer, order.eventId)
      const events = domain.charge(viewer, { order, event, id, name, email, source })

      const { amount, taxes, fee } = events.find(({ meta: { type } }) => type === 'OrderCharged') || {}

      const chargeEvents = await services.payment.charge(viewer, { order, amount, taxes, fee, event, name, email, source })

      return repo.save(events.concat(chargeEvents))
    },
    async refund (viewer, { id, amount }) {
      const order = await repo.get(id)

      const events = domain.refund(viewer, { order, amount })
      const refundEvents = await services.payment.refund(viewer, { order, amount })

      return repo.save(events.concat(refundEvents))
    },
    emitter: repo.emitter
  }
}
