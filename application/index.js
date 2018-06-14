const { Repository: QueryRepo } = require('./queries/Repository')
const { Repository: CommandRepo } = require('./commands/Repository')

const { health } = require('./queries/health')

exports.application = (viewer, command = new CommandRepo(), query = new QueryRepo()) => {
  return {
    health: health(query, viewer)
  }
}
exports.getViewer = async (token) => {
  return { roles: ['customer'] }
}
