const { fromGlobalId, toGlobalId } = require('graphql-relay')

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
      console.log("results'", results)
      return results
    }
  },
  Mutation: {
    async addProductVariant (source, { input: { clientMutationId, ...input } }, { application }) {
      const { id } = await application.addProductVariant(input)
      return { clientMutationId, id: toGlobalId('Variant', id) }
    },
    async addProduct (source, { input: { clientMutationId, ...input } }, { application }) {
      const { id } = await application.addProduct(input)
      return { clientMutationId, id: toGlobalId('Product', id) }
    }
  },
  AddProductVariantResponse: {
    variant: refetchVariant()
  },
  AddProductResponse: {
    product: refetchProduct()
  }
}

function refetchVariant (field = 'id') {
  return async (source, args, { application }) => {
    const id = args.id || source.id
    const variant = await application.getVariant(fromGlobalId(id).id)
    return variant
  }
}
function refetchProduct (field = 'id') {
  return async (source, args, { application }) => {
    const id = args.id || source.id
    const variant = await application.getProduct(fromGlobalId(id).id)
    return variant
  }
}
