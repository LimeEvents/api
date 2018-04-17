const emitter = require('../../../lib/emitter')
const Repo = require('../../../lib/mongo/repository')

const FIFTEEN_MINUTES = 1000 * 60 * 15

const reducer = (src, event) => {
  const entity = Object.assign({
    refunded: false,
    paid: false,
    fee: 0,
    taxes: 0,
    amount: 0,
    willcall: []
  }, src)
  const fn = {
    OrderCreated () {
      return {
        ...entity,
        id: event.meta.id,
        eventId: event.eventId,
        tickets: event.tickets,
        email: event.email,
        created: event.meta.timestamp,
        expired: FIFTEEN_MINUTES + event.meta.timestamp
      }
    },
    OrderCharged () {
      return {
        ...entity,
        id: event.meta.id,
        fee: event.fee,
        taxes: event.taxes,
        amount: event.amount,
        willcall: entity.willcall.concat(event.name)
      }
    },
    OrderChargeSucceeded () {
      return {
        ...entity,
        id: event.meta.id,
        chargeId: event.chargeId,
        paid: true
      }
    },
    OrderChargeFailed () {
      return {
        ...entity,
        id: event.meta.id,
        paid: false
      }
    },
    OrderRefunded () {
      return {
        ...entity,
        refundAmount: entity.amount
      }
    },
    OrderRefundSucceeded () {
      return {
        ...entity,
        refunded: true
      }
    },
    OrderRefundFailed () {
      return {
        ...entity,
        refunded: false
      }
    },
    OrderTransferred () {
      return {
        ...entity,
        tickets: event.tickets
      }
    }
    // TicketsReassigned () {
    //   entity.willcall[event.to] -= event.tickets
    //   entity.willcall[event.from] += event.tickets
    //   return entity
    // },
    // TicketsTransferred () {
    //   entity.available += event.tickets
    //   return entity
    // },
    // TicketsPurchased () {
    //   entity.available -= event.tickets
    //   entity.reserved -= event.tickets
    //   entity.sold += event.tickets
    //   entity.willcall[event.name] = event.tickets
    //   return entity
    // },
    // TicketsReturned () {
    //   entity.available += event.tickets
    //   entity.sold -= event.tickets
    //   return entity
    // },
    // ChargeSucceeded () {

    // },
    // ChargeFailed () {

    // }
  }[event.meta.type]

  if (typeof fn === 'function') return fn()
  console.warn(`Invalid event type: "${event.meta.type}"`)
  return src
}

exports.repository = (tenantId) => new Repo('order_source', reducer, emitter, tenantId)
