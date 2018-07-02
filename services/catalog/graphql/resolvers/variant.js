const { fromGlobalId, toGlobalId } = require('graphql-relay')
const { refetchProduct, refetchVariant } = require('./utils')
const resolveType = {
  __resolveType: ({ id }) => fromGlobalId(id).type
}

exports.resolvers = {
  Node: resolveType,
  Entity: resolveType,
  Taggable: resolveType,
  Medium: resolveType,
  Query: {
    ping () {
      return 'pong'
    },
    async health (source, args, { application }) {
      const results = await application.health({})
      return results
    },
    variant: refetchVariant()
  },
  Mutation: {
    async addProductVariant (source, { input: { clientMutationId, id, ...input } }, { application }) {
      id = fromGlobalId(id).id
      const { variantId } = await application.addProductVariant({ ...input, id })
      return { clientMutationId, id, variantId }
    },
    async updateProductVariant (source, { input: { clientMutationId, id, variantId, ...input } }, { application }) {
      id = fromGlobalId(id).id
      variantId = fromGlobalId(variantId).id
      await application.updateProductVariant({ ...input, id, variantId })
      return { clientMutationId, id, variantId }
    },
    async removeProductVariant (source, { input: { clientMutationId, id, variantId } }, { application }) {
      id = fromGlobalId(id).id
      variantId = fromGlobalId(variantId).id
      await application.removeProductVariant({ id, variantId })
      return { clientMutationId, id }
    }
  },
  Variant: {
    id: ({ id }) => toGlobalId('Variant', id)
  },
  Product: {
    async variants ({ id }, args, { application }) {
      return { id, ...args }
    }
  },
  ProductVariantConnection: {
    async edges ({ id, first, last, before, after }, args, { application }) {
      const variantIds = await application.listProductVariantIds({
        id,
        cursor: before || after,
        limit: first || last
      })

      return variantIds.map(id => ({ id }))
    }
  },
  ProductVariantEdge: {
    node ({ id }, args, { application }) {
      return application.getVariant(id)
    },
    cursor: ({ id }) => id
  },
  AddProductVariantResponse: {
    product: refetchProduct(),
    variant: refetchVariant('variantId')
  },
  UpdateProductVariantResponse: {
    product: refetchProduct(),
    variant: refetchVariant('variantId')
  },
  RemoveProductVariantResponse: {
    product: refetchProduct()
  }
}
