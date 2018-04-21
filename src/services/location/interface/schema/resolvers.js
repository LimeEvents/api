const { connectionFromPromisedArray, fromGlobalId, toGlobalId } = require('graphql-relay')

exports.resolvers = {
  Node: {
    __resolveType (source) {
      return fromGlobalId(source.id).type
    }
  },
  Query: {
    node: refetchLocation(),
    location: refetchLocation(),
    async locations (source, args, { viewer, application }) {
      const { edges, pageInfo } = await connectionFromPromisedArray(application.find(viewer), args)
      return {
        pageInfo,
        edges: edges.map(({ node, cursor }) => {
          return {
            cursor,
            node: { ...node, id: toGlobalId('Location', node.id) }
          }
        })
      }
    }
  }
}

function refetchLocation (field = 'id') {
  return async (source, args, { viewer, application }) => {
    const id = fromGlobalId(args[field] || source[field]).id

    const location = await application.get(viewer, id)
    return { ...location, id }
  }
}
