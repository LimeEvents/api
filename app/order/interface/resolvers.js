const { connectionFromPromisedArray } = require('graphql-relay')
const application = require('./application')

module.exports = {
  Query: {
    order: refetchResolver,
    inventory (source, { eventId }, { viewer }) {
      return application.getInventory(viewer, eventId)
    },
    orders (source, args, { viewer }, info) {
      return connectionFromPromisedArray(
        application.find(viewer, args.filter),
        args
      )
    }
  },
  Mutation: {
    async createOrder (source, { input }, { viewer }) {
      const results = await application.create(viewer, input)
      return { ...input, ...results }
    },
    async chargeOrder (source, { input }, { viewer }) {
      const results = await application.charge(viewer, input)
      return { ...input, ...results }
    },
    async refundOrder (source, { input }, { viewer }) {
      const results = await application.refund(viewer, input)
      return { ...input, ...results }
    },
    async transferOrder (source, { input }, { viewer }) {
      const results = await application.transfer(viewer, input)
      return { ...input, ...results }
    },
    async reassignOrder (source, { input }, { viewer }) {
      const results = await application.reassign(viewer, input)
      return { ...input, ...results }
    }
  },
  CreateOrderResponse: {
    order: refetchResolver,
    inventory: inventoryResolver()
  },
  ChargeOrderResponse: {
    order: refetchResolver,
    inventory: inventoryResolver()
  },
  RefundOrderResponse: {
    order: refetchResolver,
    inventory: inventoryResolver()
  },
  TransferOrderResponse: {
    order: refetchResolver,
    fromInventory: inventoryResolver('fromEventId'),
    toInventory: inventoryResolver('toEventId')
  },
  ReassignOrderResponse: {
    order: refetchResolver
  }
}

function refetchResolver (source, args, { viewer }) {
  return application.get(viewer, args.id || source.id)
}

function inventoryResolver (field = 'eventId') {
  return (source, args, { viewer }) => {
    return application.getInventory(viewer, args[field] || source[field])
  }
}
