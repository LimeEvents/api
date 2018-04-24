const memo = require('lodash.memoize')
const { Event } = require('@vivintsolar/repository')
const { Repository } = require('@vivintsolar/mongo-repository')
const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY)

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
      created: event._timestamp,
      expired: FIFTEEN_MINUTES + event._timestamp,
      fee: event.fee,
      taxes: event.taxes,
      subtotal: event.subtotal,
      total: event.total
    }
  },
  OrderCharged (entity, event) {
    return {
      ...entity,
      id: event.id,
      fee: event.fee,
      taxes: event.taxes,
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
      refundAmount: entity.amount
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
    refunded: false,
    paid: false,
    fee: 0,
    taxes: 0,
    amount: 0,
    total: 0,
    active: false,
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
        metadata: { paymentId: id },
        currency: 'USD',
        receipt_email: email,
        statement_descriptor: 'Vivint Solar'
      })
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
      await stripe.charges.refund(event.chargeId, { amount })
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
