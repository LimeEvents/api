const { fromGlobalId } = require('graphql-relay')

exports.refetchChannel = function (field = 'id') {
  return async (source, args, { application }) => {
    const id = fromGlobalId(args[field] || source[field]).id
    const channel = await application.getChannel(id)
    return { ...channel, id }
  }
}
exports.refetchProduct = function (field = 'id') {
  return async (source, args, { application }) => {
    const id = fromGlobalId(args[field] || source[field]).id
    const channel = await application.getProduct(id)
    return { ...channel, id }
  }
}
exports.refetchVariant = function (field = 'id') {
  return async (source, args, { application }) => {
    const id = fromGlobalId(args[field] || source[field]).id
    const variant = await application.getVariant(id)
    return { ...variant, id }
  }
}
