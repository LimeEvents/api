const FIFTEEN_MINUTES = 1000 * 60 * 15
const DEFAULT_REDUCER = src => src

const reducers = {
  OrderCreated (entity, event) {
    return {
      ...entity,
      id: event.id,
      eventId: event.eventId,
      locationId: event.locationId,
      performerIds: event.performerIds,

      tickets: event.tickets,

      expired: FIFTEEN_MINUTES + event._timestamp,

      customerFee: event.customerFee,
      locationFee: event.locationFee,
      fee: event.fee,
      salesTax: event.salesTax,
      subtotal: event.subtotal,
      total: event.total,
      created: event._timestamp
    }
  },
  OrderCharged (entity, event) {
    return {
      ...entity,
      id: event.id,
      fee: event.fee,
      salesTax: event.salesTax,
      email: event.email,
      amount: event.amount,
      willcall: entity.willcall.concat(event.name)
    }
  },
  OrderChargeSucceeded (entity, event) {
    return {
      ...entity,
      id: event.id,
      chargeId: event.chargeId,
      paid: true
    }
  },
  OrderChargeFailed (entity, event) {
    return {
      ...entity,
      id: event.id,
      paid: false
    }
  },
  OrderRefunded (entity, event) {
    return {
      ...entity,
      refundAmount: event.amount
    }
  },
  OrderRefundSucceeded (entity, event) {
    return {
      ...entity,
      refunded: true
    }
  },
  OrderRefundFailed (entity, event) {
    return {
      ...entity,
      refunded: false
    }
  },
  OrderTransferred (entity, event) {
    return {
      ...entity,
      tickets: event.tickets
    }
  }
}

const reducer = (src, event) => {
  if (!src) return src
  const entity = Object.assign({
    price: 0,
    tickets: 0,
    subtotal: 0,
    customerFee: 0,
    locationFee: 0,
    salesTax: 0,
    total: 0,
    amountPaid: 0,
    amountRefunded: 0,
    willcall: []
  }, src)
  const fn = reducers[event._type] || DEFAULT_REDUCER
  const results = fn(entity, event)
  if (results) results.updated = event._timestamp
  return results
}

exports.reducer = reducer
exports.reducers = reducers
