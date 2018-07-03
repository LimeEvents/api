const { fromGlobalId } = require('graphql-relay')

const defaultResolveType = ({ id }) => fromGlobalId(id).type
const resolveType = (fn = defaultResolveType) => ({ __resolveType: typeof fn === 'function' ? fn : () => fn })

exports.resolvers = {
  Node: resolveType(),
  Entity: resolveType(),
  Searchable: resolveType(),
  Visible: resolveType(),
  TagConnection: resolveType('ProductTagConnection'),
  TagEdge: resolveType('ProductTagEdge'),
  MediaConnection: resolveType('ProductMediaConnection'),
  MediaEdge: resolveType('ProductMediaEdge')
}
