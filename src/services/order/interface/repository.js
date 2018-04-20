const memo = require('lodash.memoize')
const { Repository } = require('@vivintsolar/mongo-repository')

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
        id: event.id,
        eventId: event.eventId,
        tickets: event.tickets,
        email: event.email,
        created: event._timestamp,
        expired: FIFTEEN_MINUTES + event._timestamp
      }
    },
    OrderCharged () {
      return {
        ...entity,
        id: event.id,
        fee: event.fee,
        taxes: event.taxes,
        amount: event.amount,
        willcall: entity.willcall.concat(event.name)
      }
    },
    OrderChargeSucceeded () {
      return {
        ...entity,
        id: event.id,
        chargeId: event.chargeId,
        paid: true
      }
    },
    OrderChargeFailed () {
      return {
        ...entity,
        id: event.id,
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
  }[event._type]

  if (typeof fn === 'function') return fn()
  console.warn(`Invalid event type: "${event._type}"`)
  return src
}

exports.repository = memo((tenantId) => new Repository({ name: 'order', reducer, tenantId }))
