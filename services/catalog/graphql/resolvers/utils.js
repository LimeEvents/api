const { fromGlobalId, toGlobalId } = require('graphql-relay')
const get = require('lodash.get')

function refetch (fnName, field = 'id') {
  return async (source, args, { application }) => {
    let id = get(args, field, get(source, field))
    if (!id) return null
    if (id.length !== 36) id = fromGlobalId(id).id
    const channel = await application[fnName](id)
    return { ...channel, id }
  }
}

exports.refetchChannel = refetch.bind(null, 'getChannel')
exports.refetchProduct = refetch.bind(null, 'getProduct')
exports.refetchOffer = refetch.bind(null, 'getProductOffer')

exports.dataToConnection = function (list, cursor, keys) {
  const edges = list.map(value => ({
    cursor: objectToCursor(value, keys),
    node: value
  }))

  const firstEdge = edges[0]
  const lastEdge = edges[edges.length - 1]

  return {
    edges,
    pageInfo: {
      startCursor: firstEdge ? firstEdge.cursor : null,
      endCursor: lastEdge ? lastEdge.cursor : null,
      hasPreviousPage: false,

      // TODO: fix bug: if count=2 and first=2 cursor will exist
      // not sure how to resolve this edge case yet
      hasNextPage: !!cursor
    }
  }
}

function objectToCursor (object, keys = ['id']) {
  const id = keys.length === 1
    ? object[keys[0]]
    : JSON.stringify(
      keys.reduce((prev, curr) => {
        prev[curr] = object[curr]
        return prev
      }, {})
    )
  return toGlobalId('connection', id)
}

exports.paginationToParams = function ({first, after}) {
  const params = { Limit: first }
  if (after) params.ExclusiveStartKey = { id: fromGlobalId(after).id }
  return params
}
