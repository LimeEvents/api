const merge = require('lodash.merge')
const { resolvers: Channel } = require('./channel')
const { resolvers: Product } = require('./product')

exports.resolvers = merge({}, Product, Channel)
