const assert = require('assert')
const Stripe = require('stripe')
const uuid = require('uuid/v4')
const toEvent = require('../../../adapters/BaseEvent')

module.exports = class Payment {
  constructor () {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    this.stripe = {
      charges: {
        async create (params) {
          return { id: uuid(), ...params }
        },
        async refund (id) {
          return { id }
        }
      }
    }
  }

  async charge (viewer, { order, amount, taxes, fee, description, source }) {
    assert(amount > 50, 'Amount must be greater than $0.50')
    assert(source, 'Charge source is required')
    try {
      const { id: chargeId } = await this.stripe.charges.create({
        amount,
        taxes,
        fee,
        currency: 'usd',
        source,
        description
      })
      return [
        toEvent('OrderChargeSucceeded', {
          id: order.id,
          chargeId
        })
      ]
    } catch (ex) {
      return [
        toEvent('OrderChargeFailed', {
          id: order.id
        })
      ]
    }
  }

  async refund (viewer, { order }) {
    assert(order.chargeId, 'Order must have a valid chargeId to be refunded')

    try {
      const { id } = await this.stripe.charges.refund(order.chargeId)
      return [
        toEvent('OrderRefundSucceeded', {
          id: order.id,
          chargeId: id
        })
      ]
    } catch (ex) {
      console.error(ex)
      return [
        toEvent('OrderRefundFailed', {
          id: order.id
        })
      ]
    }
  }
}
