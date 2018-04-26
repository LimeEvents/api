const memo = require('lodash.memoize')
const moment = require('moment')
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

  async aggregate (field, args) {
    const {
      start = Date.now(),
      first = 1,
      filter: { interval = 'week' }
    } = args
    const end = moment(start).endOf(interval).subtract(first, interval).unix() * 1000
    const buckets = createBuckets(start, first, interval)
    if (buckets.length < 2) buckets.unshift(0)
    const results = await this.view.aggregate([
      {
        $match: {
          created: { $gte: end, $lte: start }
        }
      },
      {
        $bucket: {
          groupBy: '$created',
          boundaries: buckets,
          default: 'Other',

          output: {
            value: { $sum: `$${field}` },
            ids: { $push: '$id' }
          }
        }
      }
    ])

    return buckets.map((timestamp) => {
      const value = results.find(({ _id }) => {
        return _id === timestamp
      })
      return {
        value: value && value.value || 0,
        type: 'aggregate',
        field,
        timestamp
      }
    })
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

function createBuckets (start, count = 1, interval = 'week') {
  start = moment(start)
  return new Array(count)
    .fill(null)
    .map((_, idx) => start.clone().subtract(idx, interval).startOf(interval).unix() * 1000)
    .reverse()
}

exports.repository = memo((tenantId) => new StripeRepository(tenantId))
