const assert = require('assert')
const Stripe = require('stripe')

module.exports = class Payment {
  constructor () {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }

  async charge (viewer, { id, amount, description, source }) {
    assert(amount > 50, 'Amount must be greater than $0.50')
    assert(source, 'Charge source is required')

    try {
      const { id: chargeId } = await this.stripe.charges.create({
        amount,
        currency: 'usd',
        source,
        description
      })
      return [{
        id,
        chargeId,
        amount,
        meta: {
          id,
          type: 'OrderChargeSucceeded',
          timestamp: Date.now()
        }
      }]
    } catch (ex) {
      return [{
        id,
        meta: {
          id,
          type: 'OrderChargeFailed',
          timestamp: Date.now()
        }
      }]
    }
  }

  refund (viewer, { id }) {

  }
}
