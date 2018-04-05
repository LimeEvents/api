const { repository } = require('./repository')
const application = require('../application')

module.exports = application(repository)
