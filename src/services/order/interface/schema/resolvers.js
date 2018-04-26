const { fromGlobalId, connectionFromArray, toGlobalId } = require('graphql-relay')

const orderGlobalId = addGlobalId.bind(this, 'Order')
const metricGlobalId = addGlobalId.bind(this, 'OrderMetric')

exports.resolvers = {
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
    async orders (source, args, { viewer, application }, info) {
      if (args.first) args.first = Math.min(args.first, 50)
      if (args.last) args.last = Math.min(args.last, 50)

      const orders = await application.find(viewer, args)
      return connectionFromArray(
        orders.map(orderGlobalId),
        args
      )
    },
    async orderMetrics (source, args, { viewer, application }) {
      const metrics = await application.getMetrics(viewer, args)
      return connectionFromArray(
        metrics.map(metricGlobalId),
        args
      )
    }
  },
  Mutation: {
    async createOrder (source, { input }, { viewer, application }) {
      const { id } = await application.create(viewer, input)
      return { clientMutationId: input.clientMutationId, id: toGlobalId('Order', id) }
    },
    async chargeOrder (source, { input }, { viewer, application }) {
      const { id } = await application.charge(viewer, {
        ...input,
        id: fromGlobalId(input.id).id
      })
      return { clientMutationId: input.clientMutationId, id: toGlobalId('Order', id) }
    },
    async refundOrder (source, { input }, { viewer, application }) {
      const { id } = await application.refund(viewer, {
        ...input,
        id: fromGlobalId(input.id).id
      })
      return { ...input, id }
    },
    async transferOrder (source, { input }, { viewer, application }) {
      const { id } = await application.transfer(viewer, {
        ...input,
        id: fromGlobalId(input.id).id
      })
      return { clientMutationId: input.clientMutationId, id: toGlobalId('Order', id) }
    },
    async reassignOrder (source, { input }, { viewer, application }) {
      const { id } = await application.reassign(viewer, {
        ...input,
        id: fromGlobalId(input.id).id
      })
      return { clientMutationId: input.clientMutationId, id: toGlobalId('Order', id) }
    },
    async cancelOrder (source, { input }, { viewer, application }) {
      const { id } = await application.cancel(viewer, input.id)
      return { clientMutationId: input.clientMutationId, id: toGlobalId('Order', id) }
    }
  },
  CreateOrderResponse: {
    order: refetchResolver()
  },
  ChargeOrderResponse: {
    order: refetchResolver()
  },
  RefundOrderResponse: {
    order: refetchResolver()
  },
  TransferOrderResponse: {
    sourceOrder: refetchResolver('sourceOrderId'),
    destinationOrder: refetchResolver('destinationOrderId')
  },
  ReassignOrderResponse: {
    order: refetchResolver()
  },
  CancelOrderResponse: {
    order: refetchResolver()
  }
}

function refetchResolver (field = 'id') {
  return async (source, args, { viewer, application }) => {
    const id = fromGlobalId(args[field] || source[field]).id
    const order = await application.get(viewer, id)
    return { ...order, id: toGlobalId('Order', id) }
  }
}

function addGlobalId (type, entity) {
  return { ...entity, id: toGlobalId(type, entity.id) }
}
