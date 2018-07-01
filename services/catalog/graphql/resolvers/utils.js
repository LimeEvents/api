const { fromGlobalId } = require('graphql-relay')

exports.refetchChannel = function (field = 'id') {
  return async (source, args, { application }) => {
    const id = args[field] || source[field]
    const channel = await application.getChannel(fromGlobalId(id).id)
    return { ...channel, id }
  }
}
exports.refetchProduct = function (field = 'id') {
  return async (source, args, { application }) => {
    const id = args[field] || source[field]
    const channel = await application.getProduct(fromGlobalId(id).id)
    return { ...channel, id }
  }
}
