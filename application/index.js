const { application: variant } = require('./Variant')

exports.application = (viewer) => {
  return {
    ...variant(viewer)
  }
}
exports.getViewer = async (token) => {
  return { roles: ['customer'] }
}
