const memo = require('lodash.memoize')
const { Event } = require('@vivintsolar/repository')
const { Repository } = require('@vivintsolar/mongo-repository')
const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY)

const CONNECT_ACCOUNT = {
  stripe_account: 'acct_1BoMxxIvz2YcN687'
}

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
  results.updated = event._timestamp
  return results
}

const StripeAntiCorruption = (stripe) => ({
  async OrderCharged (event) {
    const { source, amount, id, email } = event
    try {
      const { id: chargeId } = await stripe.charges.create({
        source,
        amount,
        application_fee: event.fee,
        metadata: { paymentId: id },
        currency: 'USD',
        receipt_email: email,
        statement_descriptor: 'Vivint Solar'
      }, CONNECT_ACCOUNT)
      return [
        event,
        new Event('OrderChargeSucceeded', {
          id,
          chargeId
        })
      ]
    } catch (ex) {
      console.error(ex)
      return [
        event,
        new Event('OrderChargeFailed', {
          id,
          reason: ex.message
        })
      ]
    }
  },
  async OrderRefunded (event) {
    const { id, chargeId, amount } = event
    try {
      await stripe.charges.refund(event.chargeId, { amount }, CONNECT_ACCOUNT)
      return [
        event,
        new Event('OrderRefundSucceeded', {
          id,
          chargeId,
          amount
        })
      ]
    } catch (ex) {
      console.error(ex)
      return [
        event,
        new Event('OrderRefundFailed', {
          id,
          reason: ex.message
        })
      ]
    }
  }
})

class StripeRepository extends Repository {
  constructor (tenantId) {
    super({ name: 'order', reducer, tenantId })
  }

  async save (events) {
    const results = await events.reduce(async (_events, event) => {
      const events = await _events
      const fn = StripeAntiCorruption(stripe)[event._type] || (async (event) => [event])
      events.push(...await fn(event))
      return events
    }, [])
    return super.save(results)
  }
}

exports.repository = memo((tenantId) => new StripeRepository(tenantId))
