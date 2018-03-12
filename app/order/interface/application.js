const { repository } = require('./repository')
const payment = require('./payment')
const { application: event } = require('../../event/interface')
const { application: location } = require('../../location/interface')

module.exports = require('../application')(repository, { event, location, payment })
