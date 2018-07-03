const { connectionFromArray, fromGlobalId, toGlobalId } = require('graphql-relay')
const { refetchProduct, dataToConnection } = require('./utils')

exports.resolvers = {
  Product: {
    id: ({ id }) => toGlobalId('Product', id),
    async variants ({ id }, { first, after }, { application }) {
      const { list, cursor } = await application.listProductVariantIds({
        id,
        limit: first,
        cursor: after && fromGlobalId(after).id
      })
      return dataToConnection(list, cursor, ['id', 'parentId'])
    }
  },
  ProductVariantEdge: {
    node: refetchProduct('node.id')
  },
  Query: {
    ping () {
      return 'pong'
    },
    async health (source, args, { application }) {
      const results = await application.health({})
      return results
    },
    product: refetchProduct(),
    async products (source, args, { application }) {
      const products = await application.listProducts({})
      return connectionFromArray(products, args)
    }
  },
  Mutation: {
    async addProduct (source, { input: { clientMutationId, ...input } }, { application }) {
      if (input.parentId) input.parentId = fromGlobalId(input.parentId).id
      const { id } = await application.addProduct(input)
      return { clientMutationId, id }
    },
    async updateProduct (source, { input: { clientMutationId, id, ...updates } }, { application }) {
      if (updates.parentId) updates.parentId = fromGlobalId(updates.parentId).id
      await application.updateProduct({
        ...updates,
        id: fromGlobalId(id).id
      })
      return { clientMutationId, id }
    },
    async removeProduct (source, { input: { clientMutationId, id } }, { application }) {
      await application.removeProduct(fromGlobalId(id).id)
      return { clientMutationId, id }
    }
  },
  AddProductResponse: {
    product: refetchProduct()
  },
  UpdateProductResponse: {
    product: refetchProduct()
  }
}
