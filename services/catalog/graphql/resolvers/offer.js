const { fromGlobalId, toGlobalId } = require('graphql-relay')
const { dataToConnection, refetchProduct, refetchOffer } = require('./utils')

exports.resolvers = {
  Offer: {
    id: ({ id }) => toGlobalId('Offer', id),
    currency: ({ currency }) => currency || 'USD'
  },
  Product: {
    async offers ({ id }, { first, after }, { application }) {
      const { list, cursor } = await application.listProductOfferIds({
        id,
        limit: first,
        cursor: after && fromGlobalId(after).id
      })
      return dataToConnection(list, cursor, ['id', 'parentId'])
    }
  },
  ProductOfferEdge: {
    node: refetchOffer('node.id')
  },
  Mutation: {
    async addProductOffer (source, { input: { clientMutationId, ...input } }, { application }) {
      const { id, offerId } = await application.addProductOffer({ ...input, id: fromGlobalId(input.id).id })
      return { clientMutationId, id, offerId }
    }
  },
  AddProductOfferResponse: {
    product: refetchProduct(),
    offer: refetchOffer('offerId')
  }
}
