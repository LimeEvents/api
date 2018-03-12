const application = require('./application')

module.exports = {
  Query: {
    order: refetchResolver,
    inventory (source, { eventId }, { viewer }) {
      return application.getInventory(viewer, eventId)
    }
  },
  Mutation: {
    async createOrder (source, { input }, { viewer }) {
      const results = await application.create(viewer, input)
      return { clientMutationId: input.clientMutationId, ...results }
    },
    async chargeOrder (source, { input }, { viewer }) {
      const results = await application.charge(viewer, input)
      return { clientMutationId: input.clientMutationId, ...results }
    },
    async refundOrder (source, { input }, { viewer }) {
      const results = await application.refund(viewer, input)
      return { clientMutationId: input.clientMutationId, ...results }
    },
    async transferOrder (source, { input }, { viewer }) {
      const results = await application.transfer(viewer, input)
      return { clientMutationId: input.clientMutationId, ...results }
    },
    async reassignOrder (source, { input }, { viewer }) {
      const results = await application.reassign(viewer, input)
      return { clientMutationId: input.clientMutationId, ...results }
    }
  }
}

function refetchResolver (source, args, { viewer }) {
  return application.get(viewer, args.id || source.id)
}
