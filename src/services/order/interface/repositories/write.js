const memo = require('lodash.memoize')
const { Event } = require('@vivintsolar/repository')
const { Repository } = require('@vivintsolar/mongo-repository')
const Stripe = require('stripe')

const { reducer: charge } = require('../application/charge')
const { reducer: create } = require('../application/create')
const { reducer: reassign } = require('../application/reassign')
const { reducer: refund } = require('../application/refund')
const { reducer: transfer } = require('../application/transfer')

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY)

const CONNECT_ACCOUNT = {
  stripe_account: 'acct_1BoMxxIvz2YcN687'
}

const DEFAULT_REDUCER = src => src

const reducers = {
  ...charge,
  ...create,
  ...reassign,
  ...refund,
  ...transfer
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

const StripeAntiCorruption = (stripe) => ({
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
  constructor (tenantId, emitter) {
    super({ name: 'order', reducer, tenantId })
    this.emitter = emitter
  }

  async charge (viewer, { order, event, source, name, email, id }) {
    try {
      const { id: chargeId } = await stripe.charges.create({
        source,
        amount: order.total,
        application_fee: event.fee,
        metadata: { paymentId: id },
        currency: 'USD',
        receipt_email: email || viewer.email,
        statement_descriptor: 'Wiseguys Comedy'
      }, CONNECT_ACCOUNT)
      return this.save([{
        _type: 'OrderChargeSucceeded',
        _timestamp: Date.now(),
        id,
        eventId: event.id,
        tickets: order.tickets,
        chargeId
      }])
    } catch (ex) {
      console.error(ex)
      return [{
        _type: 'OrderChargeFailed',
        _timestamp: Date.now(),
        id,
        reason: ex.message
      }]
    }
  }

  async save (events) {
    const results = await events.reduce(async (_events, event) => {
      const events = await _events
      const fn = StripeAntiCorruption(stripe)[event._type] || (async (event) => [event])
      events.push(...await fn(event))
      return events
    }, [])
    const final = await super.save(results)
    results.forEach((event) => this.emitter.emit(event._type, event))
    return final
  }
}

exports.repository = memo((tenantId, emitter) => new StripeRepository(tenantId, emitter))
