const { fromGlobalId, toGlobalId, connectionFromArray } = require('graphql-relay')

exports.resolvers = {
  Query: {
    node: refetchCustomer(),
    customer: refetchCustomer(),
    async customers (source, args, { viewer, application }) {
      const customers = await application.find(args)
      const { edges, pageInfo } = connectionFromArray(customers, args)
      return {
        pageInfo,
        edges: edges.map((edge) => {
          edge.node.id = toGlobalId('Customer', edge.node.id)
          return edge
        })
      }
    }
  },
  Mutation: {
    async createCustomer (source, { input }, { viewer, application }) {
      const { id } = await application.create(viewer, input)
      return { clientMutationId: input.clientMutationId, id: toGlobalId('Customer', id) }
    }
  },
  CreateCustomerResponse: {
    customer: refetchCustomer()
  }
}

function refetchCustomer (field = 'id') {
  return async (source, args, { viewer, application }) => {
    const id = fromGlobalId(args[field] || source[field]).id
    const customer = await application.get(viewer, id)
    return { ...customer, id: toGlobalId('Customer', id) }
  }
}
