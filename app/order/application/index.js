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
      const order = await repo.get(id)
      return domain.get(viewer, { order })
    },
    async getInventory (viewer, eventId) {
      const orders = await repo.find({ eventId })
      const [ sold, reserved ] = orders
        .filter(({ refunded }) => !refunded)
        .reduce((totals, { tickets, paid }) => {
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
    async transfer (viewer, { id, amount }) {
      const order = await repo.get(id)
      return repo.save(
        domain.transfer(viewer, { order, amount })
      )
    },
    async charge (viewer, { id, amount, source, description }) {
      const order = await repo.get(id)
      const events = domain.purchase(viewer, { order, amount })

      const chargeEvents = await services.payment(viewer, { id, amount, source, description })

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
