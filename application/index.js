const { application: product } = require('./Product')
const { application: variant } = require('./Variant')

exports.application = (viewer) => {
  return {
    ...product(viewer),
    ...variant(viewer)
  }
}
exports.getViewer = async (token) => {
  return { roles: ['customer'] }
}
