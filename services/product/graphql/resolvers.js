const { connectionFromArray, fromGlobalId, toGlobalId } = require('graphql-relay')

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
    }
  },
  AddProductResponse: {
    product: refetchProduct()
  }
}

function refetchProduct (field = 'id') {
  return async (source, args, { application }) => {
    const id = args.id || source.id
    const variant = await application.getProduct(fromGlobalId(id).id)
    return { ...variant, id }
  }
}
