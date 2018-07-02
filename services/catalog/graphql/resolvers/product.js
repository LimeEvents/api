const { connectionFromArray, fromGlobalId, toGlobalId } = require('graphql-relay')
const { refetchProduct } = require('./utils')

const resolveType = {
  __resolveType: ({ id }) => fromGlobalId(id).type
}

exports.resolvers = {
  Node: resolveType,
  Entity: resolveType,
  Taggable: resolveType,
  Medium: resolveType,
  Product: {
    id: ({ id }) => toGlobalId('Product', id)
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
      const { id } = await application.addProduct(input)
      return { clientMutationId, id: toGlobalId('Product', id) }
    },
    async updateProduct (source, { input: { clientMutationId, id, ...updates } }, { application }) {
      await application.updateProduct({ ...updates, id: fromGlobalId(id).id })
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
