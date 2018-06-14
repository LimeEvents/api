const { Repository: QueryRepo } = require('./queries/Repository')
const { Repository: CommandRepo } = require('./commands/Repository')

const { health } = require('./queries/health')
const { getVariant } = require('./queries/getVariant')
const { addProductVariant } = require('./commands/addProductVariant')

exports.application = (viewer, command = new CommandRepo(), query = new QueryRepo()) => {
  return {
    getVariant: getVariant(query, viewer),
    health: health(query, viewer),
    addProductVariant: addProductVariant(command, viewer)
  }
}
exports.getViewer = async (token) => {
  return { roles: ['customer'] }
}
