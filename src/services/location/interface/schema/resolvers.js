const { connectionFromPromisedArray, fromGlobalId, toGlobalId } = require('graphql-relay')

exports.resolvers = {
  Node: {
    __resolveType (source) {
      return fromGlobalId(source.id).type
    }
  },
  Query: {
    async node (source, args, { viewer, application }, info) {
      const { id } = fromGlobalId(args.id)
      const location = await application.get(viewer, id)
      return { ...location, id: toGlobalId('Location', id) }
    },
    async location (source, { id }, { viewer, application }) {
      const location = await application.get(viewer, id)
      return { ...location, id: toGlobalId('Location', id) }
    },
    async locations (source, args, { viewer, application }) {
      const { edges, pageInfo } = await connectionFromPromisedArray(application.find(viewer), args)
      return {
        edges: edges.map(({ node, cursor }) => ({ node: { ...node, id: toGlobalId('Location', node.id) }, cursor })),
        pageInfo
      }
    }
  }
}
