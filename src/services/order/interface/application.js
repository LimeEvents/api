const { repository } = require('./repository')
const Payment = require('./payment')
const { application: event } = require('../../event/interface')
const { application: location } = require('../../location/interface')
const payment = new Payment()

module.exports = require('../application')(repository, { event, location, payment })
