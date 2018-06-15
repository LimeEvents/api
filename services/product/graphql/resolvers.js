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
      console.log('mongodb', JSON.stringify(process.env, null, 2))
      return 'pong'
    },
    async health (source, args, { application }) {
      const results = await application.health({})
      console.log("results'", results)
      return results
    },
    product: refetchProduct()
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
