const { fromGlobalId } = require('graphql-relay')

exports.refetchChannel = function (field = 'id') {
  return async (source, args, { application }) => {
    let id = args[field] || source[field]
    if (id.length !== 36) id = fromGlobalId(id).id
    const channel = await application.getChannel(id)
    return { ...channel, id }
  }
}
exports.refetchProduct = function (field = 'id') {
  return async (source, args, { application }) => {
    let id = args[field] || source[field]
    if (id.length !== 36) id = fromGlobalId(id).id
    const product = await application.getProduct(id)
    return { ...product, id }
  }
}
exports.refetchVariant = function (field = 'id') {
  return async (source, args, { application }) => {
    let id = args[field] || source[field]
    if (id.length !== 36) id = fromGlobalId(id).id
    const variant = await application.getVariant(id)
    return { ...variant, id }
  }
}
