const { fromGlobalId, connectionFromPromisedArray } = require('graphql-relay')

module.exports = {
  Node: {
    __resolveType ({ id }) {
      return fromGlobalId(id).type
    }
  },
  Query: {
    order: refetchResolver(),
    inventory (source, { eventId }, { viewer, application }) {
      return application.getInventory(viewer, eventId)
    },
    orderStatistics (source, args, { viewer, application }, info) {
      return application.getStatistics(viewer, args)
    },
    orders (source, args, { viewer, application }, info) {
      if (args.first) args.first = Math.min(args.first, 50)
      if (args.last) args.last = Math.min(args.last, 50)
      return connectionFromPromisedArray(
        application.find(viewer, args),
        args
      )
    }
  },
  Mutation: {
    async createOrder (source, { input }, { viewer, application }) {
      const results = await application.create(viewer, input)
      return { ...input, ...results }
    },
    async chargeOrder (source, { input }, { viewer, application }) {
      const results = await application.charge(viewer, input)
      return { ...input, ...results }
    },
    async refundOrder (source, { input }, { viewer, application }) {
      const { id } = await application.refund(viewer, input)
      const { eventId } = await application.get(viewer, id)
      return { ...input, id, eventId }
    },
    async transferOrder (source, { input }, { viewer, application }) {
      const results = await application.transfer(viewer, input)
      return { ...input, ...results }
    },
    async reassignOrder (source, { input }, { viewer, application }) {
      const results = await application.reassign(viewer, input)
      return { ...input, ...results }
    }
  },
  CreateOrderResponse: {
    order: refetchResolver(),
    inventory: inventoryResolver()
  },
  ChargeOrderResponse: {
    order: refetchResolver(),
    inventory: inventoryResolver()
  },
  RefundOrderResponse: {
    order: refetchResolver(),
    inventory: inventoryResolver()
  },
  TransferOrderResponse: {
    sourceOrder: refetchResolver('sourceOrderId'),
    destinationOrder: refetchResolver('destinationOrderId'),
    sourceInventory: inventoryResolver('sourceEventId'),
    destinationInventory: inventoryResolver('destinationEventId')
  },
  ReassignOrderResponse: {
    order: refetchResolver()
  }
}

function refetchResolver (field = 'id') {
  return (source, args, { viewer, application }) => {
    return application.get(viewer, args[field] || source[field])
  }
}

function inventoryResolver (field = 'eventId') {
  return (source, args, { viewer, application }) => {
    return application.getInventory(viewer, args[field] || source[field])
  }
}
