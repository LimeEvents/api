const { Repository } = require('./Repository')

const { health } = require('./queries/health')
const { getVariant } = require('./queries/getVariant')
const { addProductVariant } = require('./commands/addProductVariant')

exports.application = (viewer, repository = new Repository()) => {
  return {
    getVariant: getVariant(repository, viewer),
    health: health(repository, viewer),
    addProductVariant: addProductVariant(repository, viewer)
  }
}
exports.getViewer = async (token) => {
  return { roles: ['customer'] }
}
